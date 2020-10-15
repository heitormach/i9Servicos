import { create } from "apisauce";

const apiNotificacao = create({
  baseURL: "https://exp.host/--/api/v2/push",
});

apiNotificacao.addResponseTransform((response) => {
  if (!response.ok) throw response;
});

export default apiNotificacao;
