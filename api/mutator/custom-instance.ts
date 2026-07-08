import { stringify } from 'qs'
import { showToast } from '#imports'
import { proxyBaseURL } from '~/constants'

let requestBaseURL = proxyBaseURL

if (process.env.NODE_ENV === 'development' && process.client)
  requestBaseURL = ''

const baseURL = requestBaseURL

function getAuthHeaders(): HeadersInit {
  if (process.client) {
    const token = localStorage.getItem('auth:token')
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
  }
  return {}
}

export { baseURL }

export async function customInstance<T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  params?: any
  data?: unknown
  responseType?: string
  headers?: HeadersInit
  signal?: AbortSignal
}): Promise<T> {
  let requestURL = `${baseURL}${url}`
  if (params)
    requestURL = `${requestURL}?${stringify(params)}`

  const contentType = headers?.['Content-Type'] || headers?.['content-type']

  let body = data as any

  if (contentType === 'application/json')
    body = JSON.stringify(data)

  if (contentType === 'multipart/form-data') {
    delete headers?.['Content-Type']
  }

  const response = await fetch(
    requestURL,
    {
      method,
      body,
      headers: { ...getAuthHeaders(), ...headers },
      signal,
    },
  )
  if (response.status === 204)
    return {} as T

  const json = await response.json()
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid — redirect to login
      showToast({
        type: 'fail',
        message: '请重新登录',
      })
      if (process.client) {
        localStorage.removeItem('auth:token')
        localStorage.removeItem('auth:user')
        window.location.href = '/login'
      }
      throw new Error('请重新登录')
    }
    showToast({
      type: 'fail',
      message: json.error,
    })
    throw new Error(json.error)
  }
  return json
}

export default customInstance

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = Error
