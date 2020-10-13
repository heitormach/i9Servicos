import { AsyncStorage } from "react-native";
import { create } from "apisauce";

const apiUsuario = create({
  baseURL: "https://i9mentor-usuario-service.herokuapp.com",
});

apiUsuario.addAsyncRequestTransform((request) => async () => {
  const token = await AsyncStorage.getItem("@i9App:token");

  if (token)
    request.headers["Authorization"] =
      "Bearer " + token.substring(8, token.length - 1);
});

apiUsuario.addResponseTransform((response) => {
  if (!response.ok) throw response;
});

export default apiUsuario;
