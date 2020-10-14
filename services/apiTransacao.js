import { AsyncStorage } from "react-native";
import { create } from "apisauce";

const apiTransacao = create({
  baseURL: "https://i9mentor-transacao-service.herokuapp.com",
});

apiTransacao.addAsyncRequestTransform((request) => async () => {
  const token = await AsyncStorage.getItem("@i9Servicos:token");

  if (token)
    request.headers["Authorization"] =
      "Bearer " + token.substring(8, token.length - 1);
});

apiTransacao.addResponseTransform((response) => {
  if (!response.ok) throw response;
});

export default apiTransacao;
