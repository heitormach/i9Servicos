import React from "react";
import { StyleSheet } from "react-native";

import { AppLoading, Notifications } from "expo";
import { Asset } from "expo-asset";
import * as Permissions from "expo-permissions";
import Navigation from "./navigation";
import { Block } from "./components";

// import all used images
const images = [
  require("./assets/icons/back.png"),
  require("./assets/icons/plants.png"),
  require("./assets/icons/seeds.png"),
  require("./assets/icons/flowers.png"),
  require("./assets/icons/sprayers.png"),
  require("./assets/icons/pots.png"),
  require("./assets/icons/fertilizers.png"),
  require("./assets/images/plants_1.png"),
  require("./assets/images/plants_2.png"),
  require("./assets/images/plants_3.png"),
  require("./assets/images/explore_1.png"),
  require("./assets/images/explore_2.png"),
  require("./assets/images/explore_3.png"),
  require("./assets/images/explore_4.png"),
  require("./assets/images/explore_5.png"),
  require("./assets/images/explore_6.png"),
  require("./assets/images/illustration_1.png"),
  require("./assets/images/illustration_2.png"),
  require("./assets/images/illustration_3.png"),
  require("./assets/images/avatar.png"),
];

export default class App extends React.Component {
  state = {
    isLoadingComplete: false,
  };

  componentDidMount = async () => {
    //Funcao responsavel para montar o status de permissao para o envio de notificações
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    //caso o finalStatus nao estiver liberado ou seja com granted, nao podera gerar o token de notificacaoes
    if (finalStatus !== "granted") {
      return;
    }

    //se todas as permissoes estiverem ok, sera gerado um token, que tem como objetivo a entrega das notificacoes
    //unicamente para o dispositivo responsavel por pertencer a este token
    let token = await Notifications.getExpoPushTokenAsync();
    console.log(token);
  };

  handleResourcesAsync = async () => {
    // we're caching all the images
    // for better performance on the app

    const cacheImages = images.map((image) => {
      return Asset.fromModule(image).downloadAsync();
    });

    return Promise.all(cacheImages);
  };

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this.handleResourcesAsync}
          onError={(error) => console.warn(error)}
          onFinish={() => this.setState({ isLoadingComplete: true })}
        />
      );
    }

    return (
      <Block white>
        <Navigation />
      </Block>
    );
  }
}

const styles = StyleSheet.create({});
