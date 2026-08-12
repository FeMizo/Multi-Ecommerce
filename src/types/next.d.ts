type RouteContext<Path extends string> = {
  params: Promise<Record<string, string>>
  pathname?: Path
}
