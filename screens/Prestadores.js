import React, { Component } from "react";
import {
  Dimensions,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Button, Block, Text, Input } from "../components";
import { theme, mocks } from "../constants";
const { width } = Dimensions.get("window");
import apiNegocio from "../services/apiNegocio";
import { AsyncStorage } from "react-native";

class Prestadores extends Component {
  state = {
    prestadores: [],
    loading: false,
  };

  componentDidMount() {
    //  this.setState({ agends: this.props.agends });
    const { navigation } = this.props;

    this.getPrestadores();
  }

  getPrestadores = async () => {
    const usuario = JSON.parse(await AsyncStorage.getItem("@i9App:userDados"));
    this.setState({ usuario: usuario });
    try {
      this.setState({ loading: true });
      const response = await apiNegocio.get("estabelecimento/local");

      this.setState({ prestadores: response.data, loading: false });
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", JSON.stringify(err.data));
      this.setState({ loading: false });
    }
  };

  renderPrest(prest) {
    return (
      <Block row card shadow color="#fffcfc" style={styles.agend}>
        <Block flex={0.75} column middle>
          <Text h3 bold style={{ paddingVertical: 8 }}>
            {prest.nome}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            Cidade: {prest.localizacao.cidade} - {prest.localizacao.uf}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            (Aperte para visualizar)
          </Text>
        </Block>
      </Block>
    );
  }

  renderPrestadores() {
    const { navigation } = this.props;
    const { prestadores } = this.state;
    return (
      <Block flex={0.8} column style={styles.agends}>
        <SafeAreaView style={styles.safe}>
          {prestadores.map((prest) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("PrestadorHome", { prestador: prest })
              }
              activeOpacity={0.8}
              key={`prest-${prest.cpf_proprietario}`}
            >
              {this.renderPrest(prest)}
            </TouchableOpacity>
          ))}
          {prestadores.length === 0 && (
            <Block>
              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Aqui você pode agendar um serviço com algum dos prestadores
                cadastrados em nosso aplicativo!
              </Text>
              <Text center medium height={20}>
                Clique no + para criar um novo.
              </Text>
            </Block>
          )}
        </SafeAreaView>
      </Block>
    );
  }

  render() {
    const { profile, navigation } = this.props;
    const { loading } = this.state;
    return (
      <Block>
        <Block flex={false} row center space="between" style={styles.header}>
          <Text h1 bold>
            Buscar Prestadores
          </Text>
          <Button onPress={() => navigation.navigate("Settings")}>
            <Image source={profile.avatar} style={styles.avatar} />
          </Button>
        </Block>
        <Block
          flex={false}
          row
          space="between"
          style={styles.agendHeader}
        ></Block>
        <ScrollView showsHorizontalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="green" />
          ) : (
            this.renderPrestadores()
          )}
        </ScrollView>
      </Block>
    );
  }
}

Prestadores.defaultProps = {
  profile: mocks.profile,
};

export default Prestadores;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.sizes.base * 2,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    height: theme.sizes.base * 2.2,
    width: theme.sizes.base * 2.2,
  },
  active: {
    borderBottomColor: theme.colors.secondary,
    borderBottomWidth: 3,
  },
  agendamentos: {
    flexWrap: "wrap",
    paddingHorizontal: theme.sizes.base * 2,
    marginBottom: theme.sizes.base * 3.5,
  },
  agendamento: {
    // this should be dynamic based on screen width
    minWidth: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
    maxWidth: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
    maxHeight: (width - theme.sizes.padding * 2.4 - theme.sizes.base) / 2,
  },
  agends: {
    marginTop: -55,
    paddingTop: 55 + 20,
    paddingHorizontal: 15,
    zIndex: -1,
  },
  agendHeader: {
    paddingHorizontal: 70,
    paddingBottom: 2,
  },
  agend: {
    padding: 20,
    marginBottom: 15,
  },
  agendStatus: {
    marginRight: 20,
    overflow: "hidden",
    height: 90,
  },
  safe: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 40,
    color: "white",
  },
  input: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomColor: theme.colors.gray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputs: {
    marginTop: theme.sizes.base * 0.7,
    paddingHorizontal: theme.sizes.base * 2,
  },
  inputRow: {
    alignItems: "flex-end",
  },
});
