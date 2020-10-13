import { AsyncStorage } from "react-native";
import { create } from "apisauce";

const apiNegocio = create({
  baseURL: "http://i9mentor-estab-service.herokuapp.com",
});

apiNegocio.addAsyncRequestTransform((request) => async () => {
  const token = await AsyncStorage.getItem("@i9App:token");

  if (token)
    request.headers["Authorization"] =
      "Bearer " + token.substring(8, token.length - 1);
});

apiNegocio.addResponseTransform((response) => {
  if (!response.ok) throw response;
});

export default apiNegocio;
