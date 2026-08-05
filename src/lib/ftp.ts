import net from "node:net"

type FtpConfig = {
  host: string
  port: number
  user: string
  password: string
  remoteDir: string
  publicBaseUrl: string
}

type FtpReply = {
  code: number
  message: string
}

class FtpClient {
  private socket: net.Socket
  private buffer = ""
  private lines: string[] = []
  private waiters: Array<(line: string) => void> = []

  constructor(socket: net.Socket) {
    this.socket = socket
    this.socket.setEncoding("utf8")
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk
      let index = this.buffer.indexOf("\n")
      while (index >= 0) {
        const rawLine = this.buffer.slice(0, index)
        this.buffer = this.buffer.slice(index + 1)
        const line = rawLine.replace(/\r$/, "")
        if (this.waiters.length > 0) {
          const resolve = this.waiters.shift()
          resolve?.(line)
        } else {
          this.lines.push(line)
        }
        index = this.buffer.indexOf("\n")
      }
    })
  }

  static async connect(config: Pick<FtpConfig, "host" | "port">) {
    const socket = net.connect({ host: config.host, port: config.port })
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve())
      socket.once("error", reject)
    })
    const client = new FtpClient(socket)
    await client.readReply()
    return client
  }

  private async nextLine() {
    const line = this.lines.shift()
    if (line !== undefined) return line
    return await new Promise<string>((resolve, reject) => {
      const onError = (error: Error) => {
        this.socket.off("error", onError)
        reject(error)
      }
      this.socket.once("error", onError)
      this.waiters.push((value) => {
        this.socket.off("error", onError)
        resolve(value)
      })
    })
  }

  async readReply(): Promise<FtpReply> {
    const lines: string[] = []
    const first = await this.nextLine()
    lines.push(first)
    const code = Number.parseInt(first.slice(0, 3), 10)
    if (Number.isNaN(code)) {
      return { code: 0, message: first }
    }
    if (first[3] === " ") {
      return { code, message: lines.join("\n") }
    }

    while (true) {
      const line = await this.nextLine()
      lines.push(line)
      if (line.startsWith(`${code} `)) {
        return { code, message: lines.join("\n") }
      }
    }
  }

  async send(command: string) {
    this.socket.write(`${command}\r\n`)
    return this.readReply()
  }

  async login(user: string, password: string) {
    const userReply = await this.send(`USER ${user}`)
    if (userReply.code === 230) return
    if (userReply.code !== 331) {
      throw new Error(`FTP login rejected: ${userReply.message}`)
    }
    const passReply = await this.send(`PASS ${password}`)
    if (passReply.code !== 230) {
      throw new Error(`FTP password rejected: ${passReply.message}`)
    }
  }

  async ensureDirectory(remoteDir: string) {
    const normalized = remoteDir.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "")
    if (!normalized) return

    const absolute = normalized.startsWith("/")
    if (absolute) {
      const rootReply = await this.send("CWD /")
      if (rootReply.code >= 400) {
        throw new Error(`FTP root change failed: ${rootReply.message}`)
      }
    }

    const segments = normalized.split("/").filter(Boolean)
    for (const segment of segments) {
      const cwdReply = await this.send(`CWD ${segment}`)
      if (cwdReply.code < 400) continue

      const mkdReply = await this.send(`MKD ${segment}`)
      if (mkdReply.code >= 400) {
        throw new Error(`FTP mkdir failed for ${segment}: ${mkdReply.message}`)
      }

      const retryReply = await this.send(`CWD ${segment}`)
      if (retryReply.code >= 400) {
        throw new Error(`FTP cd failed for ${segment}: ${retryReply.message}`)
      }
    }
  }

  async setBinaryMode() {
    const reply = await this.send("TYPE I")
    if (reply.code >= 400) {
      throw new Error(`FTP binary mode failed: ${reply.message}`)
    }
  }

  async openPassiveDataSocket() {
    const reply = await this.send("PASV")
    if (reply.code >= 400) {
      throw new Error(`FTP PASV failed: ${reply.message}`)
    }

    const match = reply.message.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/)
    if (!match) {
      throw new Error(`FTP PASV response invalid: ${reply.message}`)
    }

    const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`
    const port = Number(match[5]) * 256 + Number(match[6])

    const socket = net.connect({ host, port })
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve())
      socket.once("error", reject)
    })
    return socket
  }

  async stor(filename: string, payload: Buffer) {
    const dataSocket = await this.openPassiveDataSocket()
    const replyPromise = this.readReply()
    this.socket.write(`STOR ${filename}\r\n`)
    const storReply = await replyPromise
    if (storReply.code >= 400) {
      dataSocket.destroy()
      throw new Error(`FTP STOR failed: ${storReply.message}`)
    }

    dataSocket.end(payload)
    await new Promise<void>((resolve, reject) => {
      dataSocket.once("close", () => resolve())
      dataSocket.once("error", reject)
    })

    const finalReply = await this.readReply()
    if (finalReply.code >= 400) {
      throw new Error(`FTP transfer failed: ${finalReply.message}`)
    }
  }

  async quit() {
    try {
      await this.send("QUIT")
    } finally {
      this.socket.destroy()
    }
  }
}

function normalizeRemoteDir(remoteDir: string) {
  return remoteDir.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "")
}

function derivePublicPath(remoteDir: string, filename: string) {
  const normalized = normalizeRemoteDir(remoteDir)
  const marker = "/public_html"
  const index = normalized.toLowerCase().lastIndexOf(marker)
  const pathPart = index >= 0 ? normalized.slice(index + marker.length) : ""
  const combined = `${pathPart}/${filename}`.replace(/\/+/g, "/")
  return combined.startsWith("/") ? combined : `/${combined}`
}

export async function uploadFileToFtp(config: FtpConfig, filename: string, payload: Buffer) {
  if (!config.host || !config.user || !config.password || !config.remoteDir) {
    throw new Error("Faltan credenciales FTP")
  }

  const client = await FtpClient.connect({ host: config.host, port: config.port })
  try {
    await client.login(config.user, config.password)
    await client.setBinaryMode()
    await client.ensureDirectory(config.remoteDir)
    await client.stor(filename, payload)
    return {
      remotePath: `${normalizeRemoteDir(config.remoteDir)}/${filename}`.replace(/\/+/g, "/"),
      publicPath: derivePublicPath(config.remoteDir, filename),
      publicUrl: new URL(derivePublicPath(config.remoteDir, filename), config.publicBaseUrl).toString(),
    }
  } finally {
    await client.quit().catch(() => {})
  }
}
