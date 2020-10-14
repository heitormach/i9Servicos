import React, { Component } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";

import { Card, Badge, Button, Block, Text } from "../components";
import { theme, mocks } from "../constants";
import { AsyncStorage } from "react-native";
import apiUsuario from "../services/apiUsuario";

const { width } = Dimensions.get("window");

class Browse extends Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    active: "Menu",
    categories: [],
    usuario: "",
  };

  componentDidMount() {
    const { navigation } = this.props;
    this.setState({ categories: this.props.categories });
    this.buscarDadosUser();

    navigation.addListener("willFocus", () => {
      this.buscarDadosUser();
    });
  }

  logoutAlert() {
    Alert.alert("Sair da Conta", "Deseja realmente sair?", [
      {
        text: "Não",
        onPress: () => console.log("Não Sair"),
        style: "cancel",
      },
      {
        text: "Sair",
        onPress: () => this.logout(),
      },
    ]);
  }
  logout = async () => {
    const { navigation } = this.props;
    await AsyncStorage.removeItem("@i9Servicos:userDados");
    await AsyncStorage.removeItem("@i9Servicos:token");

    navigation.navigate("Welcome");
  };

  buscarDadosUser = async () => {
    const usuario = await AsyncStorage.getItem("@i9Servicos:userDados");
    try {
      const response = await apiUsuario.get("/usuarios", {
        findByToken: "true",
      });

      console.log(response);

      this.setState({ usuario: response.data });
      await AsyncStorage.multiSet([
        ["@i9Servicos:userDados", JSON.stringify(response.data)],
      ]);
    } catch (err) {
      Alert.alert("ERRO", "Erro ao buscar informações do usuário");
      console.log(err.data.message);
    }
  };
  handleTab = (tab) => {
    const { categories } = this.props;
    const filtered = categories.filter((category) =>
      category.tags.includes(tab.toLowerCase())
    );

    this.setState({ active: tab, categories: filtered });
  };

  renderTab(tab) {
    const { active } = this.state;
    const isActive = active === tab;

    return (
      <TouchableOpacity
        key={`tab-${tab}`}
        onPress={() => this.handleTab(tab)}
        style={[styles.tab, isActive ? styles.active : null]}
      >
        <Text size={16} medium gray={!isActive} secondary={isActive}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  }

  render() {
    const { profile, navigation } = this.props;
    const { categories } = this.state;
    const tabs = ["Menu"];

    return (
      <Block>
        <Block flex={false} row center space="between" style={styles.header}>
          <Text h1 bold>
            Olá,{" "}
            {String(this.state.usuario.nome_completo).substring(
              0,
              String(this.state.usuario.nome_completo).indexOf(" ")
            )}
          </Text>
          <Button onPress={() => navigation.navigate("Settings")}>
            <Image source={profile.avatar} style={styles.avatar} />
          </Button>
        </Block>

        <Block flex={false} row style={styles.tabs}>
          {tabs.map((tab) => this.renderTab(tab))}
        </Block>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ paddingVertical: theme.sizes.base * 2 }}
        >
          <Block flex={false} row space="between" style={styles.categories}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                onPress={() => navigation.navigate(category.screen)}
              >
                <Card
                  color="#fffcfc"
                  center
                  middle
                  shadow
                  style={styles.category}
                >
                  <Badge margin={[0, 0, 15]} size={40}>
                    <Image source={category.image} />
                  </Badge>
                  <Text center medium height={20}>
                    {category.name}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              key={"ajuda"}
              onPress={() => Linking.openURL("tel:11999191751")}
            >
              <Card
                color="#fffcfc"
                center
                middle
                shadow
                style={styles.category}
              >
                <Badge margin={[0, 0, 15]} size={40}>
                  <Image source={require("../assets/icons/ajuda.png")} />
                </Badge>
                <Text medium height={20}>
                  Ajuda
                </Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity key={"logout"} onPress={() => this.logoutAlert()}>
              <Card
                color="#fffcfc"
                center
                middle
                shadow
                style={styles.category}
              >
                <Badge margin={[0, 0, 15]} size={40}>
                  <Image source={require("../assets/icons/logout.png")} />
                </Badge>
                <Text medium height={20}>
                  Sair
                </Text>
              </Card>
            </TouchableOpacity>
          </Block>
        </ScrollView>
      </Block>
    );
  }
}

Browse.defaultProps = {
  profile: mocks.profile,
  categories: mocks.categories,
};

export default Browse;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.sizes.base * 2,
    paddingVertical: theme.sizes.base * 3,
  },
  avatar: {
    height: theme.sizes.base * 2.2,
    width: theme.sizes.base * 2.2,
  },
  tabs: {
    borderBottomColor: theme.colors.gray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: theme.sizes.base * 2,
  },
  tab: {
    marginRight: theme.sizes.base * 2,
    paddingBottom: theme.sizes.base,
  },
  active: {
    borderBottomColor: theme.colors.secondary,
    borderBottomWidth: 3,
  },
  categories: {
    flexWrap: "wrap",
    paddingHorizontal: theme.sizes.base * 2,
    marginBottom: theme.sizes.base * 3.5,
  },
  category: {
    // this should be dynamic based on screen width
    minWidth: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
    maxWidth: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
    maxHeight: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
  },
});
