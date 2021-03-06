import React, { Component } from "react";
import {
  Dimensions,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";

import { Button, Block, Text, Input } from "../components";
import { theme, mocks } from "../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-community/picker";
import moment from "moment";
const { width } = Dimensions.get("window");
import apiAgendamento from "../services/apiAgendamento";
import { AsyncStorage } from "react-native";
import apiNotificacao from "../services/apiNotificacao";
import { showLocation } from "react-native-map-link";
import apiUsuario from "../services/apiUsuario";

class Agendamento extends Component {
  state = {
    agendamentos: [],
    options: {
      latitude: 38.8976763,
      longitude: -77.0387185,
      title: "",
      dialogTitle: "Deseja abrir em qual aplicativo?",
      dialogMessage: "",
      cancelText: "Cancelar",
    },
    agendamento: {
      cpf_prop_estab: null,
      data_hora: new Date(),
      status: "PENDENTE",
      cliente: {
        endereco: {},
      },
      servico: {},
      estabelecimento: {
        contatos: [],
        localizacao: {},
      },
    },
    agendamentoSelected: {
      data_hora: String(new Date()),
      servico: {},
      cliente: {},
      estabelecimento: {
        contatos: [],
        localizacao: {},
      },
    },
    usuario: {},
    mesSelected: new Date().getMonth() + 1,
    servicos: [],
    cliente: {},
    showNewService: false,
    showDatePicker: false,
    showTimePicker: false,
    showEndereco: false,
    loading: false,
    showModal: false,
    token_notificacao: "",
  };

  componentDidMount() {
    //  this.setState({ agends: this.props.agends });
    const { navigation } = this.props;

    this.getAgendamentos();
    navigation.addListener("willFocus", () => {
      this.getAgendamentos();
    });
    this.getUserDados();
  }

  showAgendamento(agendamento) {
    this.setState({ agendamentoSelected: agendamento, showModal: true });
    console.log(agendamento.data_hora);
  }

  alertCancela() {
    Alert.alert(
      "Cancelar agendamento",
      "Deseja cancelar o agendamento do serviço?",
      [
        {
          text: "Não",
          onPress: console.log("Não"),
          style: "cancel",
        },
        { text: "Cancelar", onPress: () => this.cancelarAgendamento() },
      ]
    );
  }

  openContato() {
    const { agendamentoSelected } = this.state;

    Linking.openURL(
      `tel:${agendamentoSelected.estabelecimento.contatos[0].ddd}${agendamentoSelected.estabelecimento.contatos[0].numero}`
    );
  }

  openEndereco() {
    const { agendamentoSelected, options } = this.state;

    options.dialogMessage = `Endereço:\n${
      agendamentoSelected.estabelecimento.localizacao.logradouro
    }, ${agendamentoSelected.estabelecimento.localizacao.numero}, ${
      agendamentoSelected.estabelecimento.localizacao.cidade
    }, ${agendamentoSelected.estabelecimento.localizacao.uf}, ${
      agendamentoSelected.estabelecimento.localizacao.complemento
        ? agendamentoSelected.estabelecimento.localizacao.complemento + ","
        : ""
    } ${agendamentoSelected.estabelecimento.localizacao.cep}`;
    options.title = `${agendamentoSelected.estabelecimento.localizacao.logradouro}, ${agendamentoSelected.estabelecimento.localizacao.numero}, ${agendamentoSelected.estabelecimento.localizacao.cidade}, ${agendamentoSelected.estabelecimento.localizacao.uf}, ${agendamentoSelected.estabelecimento.localizacao.cep}`;

    showLocation(options);
  }

  getUserDados = async () => {
    const usuario = JSON.parse(
      await AsyncStorage.getItem("@i9Servicos:userDados")
    );

    this.setState({ usuario: usuario });
  };

  getTokenNotificacao = async () => {
    const { agendamentoSelected } = this.state;

    try {
      const response = await apiUsuario.get("/usuarios/notificacao", {
        cpf: agendamentoSelected.cpf_proprietario,
        tipo: "PRESTADOR",
      });

      this.setState({
        token_notificacao: response.data.token_notificacao,
      });
    } catch (err) {
      Alert.alert("Erro", JSON.stringify(err.data));
    }
  };

  sendNotificacao = async () => {
    const { agendamentoSelected } = this.state;

    console.log(agendamentoSelected.data_hora);
    const dataAgendamento = moment(
      String(agendamentoSelected.data_hora).substring(0, 10)
    ).format("DD/MM/YYYY");
    const horaAgendamento = String(agendamentoSelected.data_hora).substring(
      11,
      16
    );

    try {
      const response = await apiNotificacao.post("/send", {
        to: agendamentoSelected.token_notif_prest,
        sound: "default",
        title: "Agendamento Cancelado",
        body: `O agendamento de ${agendamentoSelected.servico.nome} no dia ${dataAgendamento} - ${horaAgendamento}  foi cancelado pelo cliente ${agendamentoSelected.cliente.nome}`,
        data: {},
      });
    } catch (err) {
      Alert.alert("Erro", JSON.stringify(err.data));
      console.log(err);
    }
  };

  cancelarAgendamento = async () => {
    const { agendamentoSelected } = this.state;
    try {
      this.setState({
        loading: true,
      });
      const response = await apiAgendamento.post("/agendamento/cancelar", {
        id_agendamento: agendamentoSelected.id,
      });
      this.setState((prev) => ({
        agendamentoSelected: {
          ...prev.agendamentoSelected,
          status: "CANCELADO",
        },
      }));
      Alert.alert("Cancelado!", "O agendamento foi cancelado com sucesso.");
      this.setState({
        loading: false,
      });
      this.sendNotificacao();
      this.getAgendamentos();
    } catch (err) {
      Alert.alert("Erro", JSON.stringify(err.data));
      console.log(err);
      this.setState({
        loading: false,
      });
    }
  };

  changeServico(servico) {
    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        servico: servico,
      },
    }));
  }

  getAgendamentos = async () => {
    const usuario = JSON.parse(
      await AsyncStorage.getItem("@i9Servicos:userDados")
    );
    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        cpf_prop_estab: usuario.cpf,
      },
    }));
    this.setState({ usuario: usuario });
    try {
      this.setState({ loading: true });
      const response = await apiAgendamento.get("agendamento/cliente");

      this.setState({ agendamentos: response.data, loading: false });
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", JSON.stringify(err.data));
      this.setState({ loading: false });
    }
  };

  renderAgend(agend) {
    return (
      <Block row card shadow color="#fffcfc" style={styles.agend}>
        <Block
          flex={0.25}
          card
          column
          color={agend.status === "CANCELADO" ? "orange" : "secondary"}
          style={styles.agendStatus}
        >
          <Block
            flex={0.25}
            middle
            center
            color={
              agend.status === "CANCELADO"
                ? theme.colors.accent
                : theme.colors.primary
            }
          >
            <Text h2 white style={{ textTransform: "uppercase" }}>
              Data
            </Text>
          </Block>
          <Block flex={0.7} center middle>
            <Text h2 white>
              {new Date(agend.data_hora.substring(0, 10)).getUTCDate()}/
              {new Date(agend.data_hora.substring(0, 10)).getUTCMonth() + 1}
            </Text>
          </Block>
        </Block>
        <Block flex={0.75} column middle>
          <Text h3 style={{ paddingVertical: 8 }}>
            Prestador: {agend.estabelecimento.nome}
          </Text>
          <Text h3 style={{ paddingVertical: 8 }}>
            Serviço: {agend.servico.nome}
          </Text>
          <Text h3 style={{ paddingVertical: 8 }}>
            R$ {Number(agend.servico.preco).toFixed(2)}
          </Text>
          <Text h3 style={{ paddingVertical: 8 }}>
            Horário: {agend.data_hora.substring(11, 16)}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            (Aperte para visualizar)
          </Text>
        </Block>
      </Block>
    );
  }

  renderModal() {
    const { agendamentoSelected, loading, showModal } = this.state;
    const dataCorrect = new Date(
      agendamentoSelected.data_hora.substring(0, 10)
    );
    const horaCorrect = agendamentoSelected.data_hora
      ? agendamentoSelected.data_hora.substring(11, 16)
      : "00:00";
    return (
      <Modal
        animationType="slide"
        visible={showModal}
        onRequestClose={() => this.setState({ showModal: false })}
      >
        <Block
          padding={[theme.sizes.padding * 2, theme.sizes.padding]}
          space="between"
        >
          <Text h1 light>
            {agendamentoSelected.servico.nome} - {dataCorrect.getUTCDate()}/
            {dataCorrect.getMonth() + 1}
          </Text>
          <ScrollView style={{ marginVertical: theme.sizes.padding }}>
            <Text h2>
              Prestador: {agendamentoSelected.estabelecimento.nome}
            </Text>
            <Text h2>Descrição do Serviço:</Text>
            <Text h3 light style={{ marginBottom: theme.sizes.base }}>
              {agendamentoSelected.servico.descricao}
            </Text>
            <Text h2 style={{ marginBottom: theme.sizes.base }}>
              Horário: {horaCorrect}
            </Text>
            <Text h2>Status: {agendamentoSelected.status}</Text>
          </ScrollView>
          <Block middle padding={[theme.sizes.base / 2, 0]}>
            <Button
              color={theme.colors.primary}
              onPress={() => this.openContato()}
            >
              <Text bold white center>
                Entrar em contato com prestador
              </Text>
            </Button>
            {agendamentoSelected.estabelecimento.localizacao && (
              <Button gradient onPress={() => this.openEndereco()}>
                <Text bold white center>
                  Endereço do Prestador
                </Text>
              </Button>
            )}
            {agendamentoSelected.status !== "CANCELADO" &&
              agendamentoSelected.status !== "CONCLUIDO" && (
                <Button color="accent" onPress={() => this.alertCancela()}>
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text bold white center>
                      Cancelar
                    </Text>
                  )}
                </Button>
              )}
            <Button
              color="orange"
              onPress={() => this.setState({ showModal: false })}
            >
              <Text center white>
                Voltar
              </Text>
            </Button>
          </Block>
        </Block>
      </Modal>
    );
  }

  renderAgends() {
    const { navigation } = this.props;
    const { agendamentos } = this.state;
    return (
      <Block flex={0.8} column style={styles.agends}>
        <SafeAreaView style={styles.safe}>
          {agendamentos.map((info) => (
            <TouchableOpacity
              activeOpacity={0.8}
              key={`agend-${info.data_hora}`}
              onPress={() => this.showAgendamento(info)}
            >
              {this.renderAgend(info)}
            </TouchableOpacity>
          ))}
          {agendamentos.length === 0 && (
            <Block>
              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Aqui você pode consultar os seus serviços agendados.
              </Text>

              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Nenhum agendamento encontrado.
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
            Agendamentos
          </Text>
          <Button onPress={() => navigation.navigate("Settings")}>
            <Image source={profile.avatar} style={styles.avatar} />
          </Button>
        </Block>
        <ScrollView showsHorizontalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="green" />
          ) : (
            this.renderAgends()
          )}
        </ScrollView>
        {this.renderModal()}
      </Block>
    );
  }
}

Agendamento.defaultProps = {
  profile: mocks.profile,
};

export default Agendamento;

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
