const peopleApiBaseUrl = "https://people.googleapis.com/v1"

export async function fetchGooglePhoneNumber(accessToken: string) {
  const res = await fetch(`${peopleApiBaseUrl}/people/me?personFields=phoneNumbers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) return null

  const data = await res.json() as {
    phoneNumbers?: Array<{ value?: string | null }>
  }

  return data.phoneNumbers?.find((entry) => typeof entry.value === "string" && entry.value.trim())?.value?.trim() ?? null
}
