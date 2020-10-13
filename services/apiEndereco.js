import { create } from "apisauce";

const apiNegocio = create({
  baseURL: "https://viacep.com.br/ws",
});

apiNegocio.addAsyncRequestTransform((request) => async () => {});

apiNegocio.addResponseTransform((response) => {
  if (!response.ok) throw response;
});

export default apiNegocio;
