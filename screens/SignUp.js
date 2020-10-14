import React, { Component } from "react";
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";

import { AsyncStorage } from "react-native";

import { Button, Block, Input, Text, Switch } from "../components";
import { theme } from "../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import apiUsuario from "../services/apiUsuario";
import moment from "moment";
const { width } = Dimensions.get("window");

export default class SignUp extends Component {
  state = {
    email: null,
    username: null,
    password: null,
    c_password: null,
    errors: [],
    loading: false,
    contato: {
      celular: {
        ddd: null,
        numero: null,
      },
      email: "",
    },
    cpf: "",
    dados_login: {
      login: "",
      senha: "",
    },
    data_nascimento: moment(new Date()).format("DD/MM/YYYY"),
    data_datetime: new Date(),
    ind_whatsapp: false,
    nome_completo: "",
    tipo_usuario: "CLIENTE",
    show: false,
    mode: "date",
    loading: false,
  };

  setShow = (type) => {
    this.setState({ show: type });
  };

  onChange = (event, date) => {
    this.setShow(false);
    if (date) {
      const currentDate = date;
      this.setState({
        data_nascimento: moment(new Date(date)).format("DD/MM/YYYY"),
        data_datetime: moment(new Date(date)).format("YYYY-MM-DD"),
      });
    }
  };

  setMode = (currentMode) => {
    this.setState({ mode: currentMode });
  };
  showMode = (currentMode) => {
    this.setShow(true);
    this.setMode(currentMode);
  };

  showDatepicker = () => {
    this.setShow(true);
    this.setState({ mode: "date" });
  };

  handleLogin = async () => {
    const { navigation } = this.props;
    const { dados_login, tipo_usuario } = this.state;
    try {
      this.setState({ loading: true });

      const response = await apiUsuario.post("/usuarios/token", null, {
        params: {
          login: dados_login.login,
          senha: dados_login.senha,
          tipo_usuario: tipo_usuario,
        },
      });

      await AsyncStorage.multiSet([
        ["@i9Servicos:token", JSON.stringify(response.data.token)],
        ["@i9Servicos:user", JSON.stringify(response.data)],
      ]);

      Keyboard.dismiss();

      this.setState({ loading: false });

      navigation.navigate("Browse");
    } catch (err) {
      console.log(err);
      this.setState({ loading: false });
    }
  };

  handleSignUp = async () => {
    const { navigation } = this.props;
    if (this.state.dados_login.senha !== this.state.c_password) {
      Alert.alert("ERRO", "As duas senhas devem ser iguais");
    } else {
      try {
        this.setState({ loading: true });

        const response = await apiUsuario.post("/usuarios", {
          contato: {
            celular: {
              ddd: this.state.contato.celular.ddd,
              ind_whatsapp: this.state.ind_whatsapp,
              numero: this.state.contato.celular.numero,
            },
            email: this.state.email,
          },
          cpf: this.state.cpf,
          dados_login: {
            login: this.state.email,
            senha: this.state.dados_login.senha,
          },
          data_nascimento: this.state.data_datetime,
          nome_completo: this.state.nome_completo,
          tipo_usuario: "CLIENTE",
        });

        Keyboard.dismiss();

        this.setState({ loading: false });

        this.handleLogin();

        // navigation.navigate("Browse");
      } catch (err) {
        console.log(err);
        Alert.alert("ERRO", err.data.mensagem);
        this.setState({ loading: false });
      }
    }
  };

  render() {
    const { navigation } = this.props;
    const { loading, errors } = this.state;
    const hasErrors = (key) => (errors.includes(key) ? styles.hasErrors : null);

    return (
      <KeyboardAvoidingView style={styles.signup}>
        <Block flex={false} row center space="between" style={styles.header}>
          <Text h1 bold>
            Cadastro
          </Text>
        </Block>
        <ScrollView>
          <Block middle style={styles.inputs}>
            <Input
              email
              label="Email"
              error={hasErrors("email")}
              style={[styles.input, hasErrors("email")]}
              defaultValue={this.state.email}
              onChangeText={(text) => {
                this.state.email = text;
                this.state.contato.email = text;
                this.state.dados_login.login = text;
              }}
            />
            <Input
              label="Nome Completo"
              error={hasErrors("nome_completo")}
              style={[styles.input, hasErrors("nome_completo")]}
              defaultValue={this.state.nome_completo}
              onChangeText={(text) => this.setState({ nome_completo: text })}
            />
            <Input
              label="CPF"
              number
              error={hasErrors("cpf")}
              style={[styles.input, hasErrors("cpf")]}
              defaultValue={String(this.state.cpf)}
              onChangeText={(text) => this.setState({ cpf: text })}
              maxLength={11}
            />
            <TouchableOpacity onPress={() => this.showDatepicker()}>
              <Text gray2>Data de Nascimento</Text>
              <Text>{this.state.data_nascimento}</Text>
            </TouchableOpacity>
            {this.state.show && (
              <DateTimePicker
                value={this.state.data_datetime}
                mode={this.state.mode}
                display="calendar"
                onChange={(event, date) => this.onChange(event, date)}
              />
            )}
            <Input
              number
              label="DDD"
              style={[styles.input]}
              defaultValue={this.state.contato.celular.ddd}
              onChangeText={(text) => (this.state.contato.celular.ddd = text)}
              maxLength={2}
            />
            <Input
              number
              label="Celular"
              style={[styles.input]}
              defaultValue={this.state.contato.celular.numero}
              onChangeText={(text) =>
                (this.state.contato.celular.numero = text)
              }
              maxLength={9}
            />
            <Block
              row
              center
              space="between"
              style={{ marginBottom: theme.sizes.base * 2 }}
            >
              <Text gray2>O número informado é WhatsApp?</Text>
              <Switch
                value={this.state.ind_whatsapp}
                onValueChange={(value) =>
                  this.setState({
                    ind_whatsapp: value,
                  })
                }
              />
            </Block>
            <Input
              secure
              label="Senha"
              error={hasErrors("password")}
              style={[styles.input, hasErrors("password")]}
              defaultValue={this.state.senha}
              onChangeText={(text) => (this.state.dados_login.senha = text)}
            />
            <Input
              secure
              label="Confirmar Senha"
              error={hasErrors("c_password")}
              style={[styles.input, hasErrors("c_password")]}
              defaultValue={this.state.c_password}
              onChangeText={(text) => (this.state.c_password = text)}
            />
            <Button gradient onPress={() => this.handleSignUp()}>
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text bold white center>
                  Cadastrar
                </Text>
              )}
            </Button>

            <Button onPress={() => navigation.navigate("Login")}>
              <Text
                gray
                center
                caption
                style={{ textDecorationLine: "underline" }}
              >
                Voltar para Login
              </Text>
            </Button>
          </Block>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  signup: {
    flex: 1,
    justifyContent: "center",
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
  hasErrors: {
    borderBottomColor: theme.colors.accent,
  },
  header: {
    paddingHorizontal: theme.sizes.base * 2,
  },
  category: {
    // this should be dynamic based on screen width
    minWidth: (width - theme.sizes.padding * 4 - theme.sizes.base) / 2,
    maxWidth: (width - theme.sizes.padding * 4 - theme.sizes.base) / 2,
    maxHeight: (width - theme.sizes.padding * 4 - theme.sizes.base) / 2,
  },
});
