import React, { Component } from "react";
import {
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Button, Block, Text, Input } from "../components";
import { theme, mocks } from "../constants";
import { AsyncStorage } from "react-native";
import moment from "moment";
import apiUsuario from "../services/apiUsuario";

class Settings extends Component {
  state = {
    budget: 850,
    monthly: 1700,
    notifications: true,
    newsletter: false,
    editing: null,
    email: null,
    profile: {},
    username: null,
    password: null,
    c_password: null,
    errors: [],
    usuario: {
      contato: {
        celular: {},
      },
      dados_login: {},
    },
    loading: false,
    alteraSenha: false,
    senhaAtual: "",
    senhaAtualDigitada: "",
    confirmarSenha: "",
    usuariobkp: {},
  };

  componentDidMount() {
    this.setState({ profile: this.props.profile });
    this.getUsuario();
  }

  handleEdit(name, text) {
    const { usuario } = this.state;
    profile[name] = text;

    this.setState({ usuario });
  }

  handleBotaoNovaSenha() {
    const { alteraSenha } = this.state;
    this.setState({
      alteraSenha: !alteraSenha,
    });
  }

  handleLogin = async () => {
    const { usuariobkp } = this.state;
    try {
      this.setState({ loading: true });

      const response = await apiUsuario.post("/usuarios/token", null, {
        params: {
          login: usuariobkp.dados_login.login,
          senha: usuariobkp.dados_login.senha,
          tipo_usuario: "PRESTADOR",
        },
      });

      await AsyncStorage.multiSet([
        ["@i9Servicos:token", JSON.stringify(response.data.token)],
        ["@i9Servicos:user", JSON.stringify(response.data)],
      ]);

      this.buscarDadosUser();
    } catch (err) {
      Alert.alert("ERRO", JSON.stringify(err.data));
      console.log(err);
      this.setState({ loading: false });
    }
  };

  buscarDadosUser = async () => {
    const usuario = await AsyncStorage.getItem("@i9Servicos:userDados");
    try {
      const response = await apiUsuario.get("/usuarios", {
        findByToken: "true",
      });

      this.setState({ usuario: response.data });
      await AsyncStorage.multiSet([
        ["@i9Servicos:userDados", JSON.stringify(response.data)],
      ]);
    } catch (err) {
      Alert.alert("ERRO", "Erro ao buscar informações do usuário");
      console.log(err);
    }
  };

  getUsuario = async () => {
    const usuario = JSON.parse(
      await AsyncStorage.getItem("@i9Servicos:userDados")
    );
    this.setState({
      usuario: usuario,
      senhaAtual: usuario.dados_login.senha,
      usuariobkp: usuario,
    });
  };

  toggleEdit(name) {
    const { editing } = this.state;
    this.setState({ editing: !editing ? name : null });
  }

  mCPF(cpf) {
    if (cpf) {
      cpf = cpf.replace(/\D/g, "");
      cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
      cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
      cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      return cpf;
    }
  }

  saveUsuario = async () => {
    const { usuario } = this.state;
    try {
      this.setState({ loading: true });
      const response = await apiUsuario.patch("/usuarios", usuario);
      Alert.alert("Alterado!", "Dados do usuário alterados com sucesso");
      this.setState({ loading: false });
    } catch (err) {
      Alert.alert("Erro", JSON.stringify(err.data));
      this.setState({ loading: false });
    }
  };

  alterarSenhaFunc = async () => {
    const {
      usuario,
      usuariobkp,
      senhaAtual,
      senhaAtualDigitada,
      confirmarSenha,
    } = this.state;
    if (senhaAtual !== senhaAtualDigitada) {
      Alert.alert("Erro", "Senha atual incorreta.");
    } else if (usuario.dados_login.senha !== confirmarSenha) {
      Alert.alert(
        "Erro",
        "A senha nova deve ser igual à do campo Confirmar Senha."
      );
    } else {
      try {
        this.setState({ loading: true });
        this.setState((prev) => ({
          usuariobkp: {
            ...prev.usuariobkp,
            dados_login: {
              ...prev.usuariobkp.dados_login,
              senha: confirmarSenha,
            },
          },
        }));
        const response = await apiUsuario.patch("/usuarios", usuariobkp);
        Alert.alert("Alterado!", "Senha alterada com sucesso.");
        this.setState({ loading: false });
        this.handleLogin();
      } catch (err) {
        Alert.alert("Erro", JSON.stringify(err.data));
        this.setState({ loading: false });
      }
    }
  };

  renderEdit(name) {
    const { usuario, editing } = this.state;

    if (editing === name) {
      return (
        <TextInput
          defaultValue={usuario[name]}
          onChangeText={(text) => this.handleEdit([name], text)}
        />
      );
    }

    return <Text bold>{usuario[name]}</Text>;
  }

  render() {
    const { profile, usuario, loading, alteraSenha, usuariobkp } = this.state;

    console.log("Usuário", usuario);
    return (
      <Block>
        <Block flex={false} row center space="between" style={styles.header}>
          <Text h1 bold>
            Dados do Usuário
          </Text>
          <Button>
            <Image source={profile.avatar} style={styles.avatar} />
          </Button>
        </Block>

        <KeyboardAvoidingView style={styles.signup}>
          <ScrollView>
            <Block style={styles.inputs}>
              {!alteraSenha ? (
                <Block>
                  <Text gray2>E-mail</Text>
                  <Text>{usuario.contato.email}</Text>

                  <Input
                    label="Nome Completo"
                    style={[styles.input]}
                    defaultValue={usuario.nome_completo}
                    onChangeText={(text) => {
                      usuario.nome_completo = text;
                    }}
                  />
                  <Block style={{ marginBottom: 30 }}>
                    <Text gray2>CPF</Text>
                    <Text>{this.mCPF(usuario.cpf)}</Text>
                  </Block>
                  <Block>
                    <Text gray2>Data de Nascimento</Text>
                    <Text>
                      {moment(usuario.data_nascimento).format("DD/MM/YYYY")}
                    </Text>
                  </Block>
                  <Input
                    number
                    label="DDD"
                    style={[styles.input]}
                    defaultValue={String(usuario.contato.celular.ddd)}
                    onChangeText={(text) => {
                      usuario.contato.celular.ddd = text;
                    }}
                    maxLength={2}
                  />
                  <Input
                    number
                    label="Número Telefone"
                    style={[styles.input]}
                    defaultValue={String(usuario.contato.celular.numero)}
                    onChangeText={(text) => {
                      usuario.contato.celular.numero = text;
                    }}
                    maxLength={9}
                  />
                </Block>
              ) : (
                <Block>
                  <Input
                    secure
                    label="Senha Atual"
                    style={[styles.input]}
                    defaultValue={""}
                    onChangeText={(text) =>
                      this.setState({
                        senhaAtualDigitada: text,
                      })
                    }
                  />
                  <Input
                    secure
                    label="Senha Nova"
                    style={[styles.input]}
                    defaultValue={""}
                    onChangeText={(text) =>
                      this.setState((prev) => ({
                        usuario: {
                          ...prev.usuario,
                          dados_login: {
                            ...prev.usuario.dados_login,
                            senha: text,
                          },
                        },
                      }))
                    }
                  />
                  <Input
                    secure
                    label="Confirmar Senha"
                    style={[styles.input]}
                    defaultValue={""}
                    onChangeText={(text) =>
                      this.setState({
                        confirmarSenha: text,
                      })
                    }
                  />
                </Block>
              )}
              {!alteraSenha ? (
                <Block middle padding={[theme.sizes.base / 2, 0]}>
                  <Button
                    color="orange"
                    onPress={() => this.handleBotaoNovaSenha()}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text bold white center>
                        Alterar Senha
                      </Text>
                    )}
                  </Button>
                  <Button gradient onPress={() => this.saveUsuario()}>
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text bold white center>
                        Salvar
                      </Text>
                    )}
                  </Button>
                </Block>
              ) : (
                <Block middle padding={[theme.sizes.base / 2, 0]}>
                  <Button
                    onPress={() => this.alterarSenhaFunc()}
                    color="orange"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text bold white center>
                        Salvar Nova Senha
                      </Text>
                    )}
                  </Button>
                  <Button gradient onPress={() => this.handleBotaoNovaSenha()}>
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text bold white center>
                        Voltar para os dados do usuário
                      </Text>
                    )}
                  </Button>
                </Block>
              )}
            </Block>
          </ScrollView>
        </KeyboardAvoidingView>
      </Block>
    );
  }
}

Settings.defaultProps = {
  profile: mocks.profile,
};

export default Settings;

const styles = StyleSheet.create({
  signup: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: theme.sizes.base * 2,
  },
  avatar: {
    height: theme.sizes.base * 2.2,
    width: theme.sizes.base * 2.2,
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
  sliders: {
    marginTop: theme.sizes.base * 0.7,
    paddingHorizontal: theme.sizes.base * 2,
  },
  thumb: {
    width: theme.sizes.base,
    height: theme.sizes.base,
    borderRadius: theme.sizes.base,
    borderColor: "white",
    borderWidth: 3,
    backgroundColor: theme.colors.secondary,
  },
  toggles: {
    paddingHorizontal: theme.sizes.base * 2,
  },
});
