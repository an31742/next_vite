export interface ILoginParams {
  name: string
  password: string | number
}
export interface ILoginApi {
  login: (params: ILoginParams) => Promise<any>
}
