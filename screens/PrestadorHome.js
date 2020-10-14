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

import { Button, Block, Text, Input, Card } from "../components";
import { theme, mocks } from "../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-community/picker";
import moment from "moment";
const { width } = Dimensions.get("window");
import apiAgendamento from "../services/apiAgendamento";
import apiNegocio from "../services/apiNegocio";
import { AsyncStorage } from "react-native";
import apiEndereco from "../services/apiEndereco";
import { showLocation } from "react-native-map-link";

class PrestadorHome extends Component {
  state = {
    dadosPrestador: this.props.navigation.state.params.prestador,
    agendamento: {
      cpf_prop_estab: null,
      data_hora: new Date(),
      status: "PENDENTE",
      cliente: {
        endereco: {},
      },
      servico: {},
    },
    dadosNegocio: {
      servicos: [
        {
          servico: {
            preco: 0.0,
          },
        },
      ],
      contatos: [],
      horario_atendimento: [],
    },
    showTelefones: null,
    listaUF: [
      "AC",
      "AL",
      "AM",
      "AP",
      "BA",
      "CE",
      "DF",
      "ES",
      "GO",
      "MA",
      "MG",
      "MS",
      "MT",
      "PA",
      "PB",
      "PE",
      "PI",
      "PR",
      "RJ",
      "RN",
      "RO",
      "RR",
      "RS",
      "SC",
      "SE",
      "SP",
      "TO",
    ],
    diaSelected: moment(new Date()).format("DD/MM/YYYY"),
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    dataFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    dateTime: new Date(),
    cliente: {},
    showNewService: false,
    showDatePicker: false,
    showTimePicker: false,
    showEndereco: false,
    loading: false,
    options: {
      latitude: 38.8976763,
      longitude: -77.0387185,
      title: "",
      dialogTitle: "Deseja abrir em qual aplicativo?",
      dialogMessage: "",
      cancelText: "Cancelar",
    },
  };

  openEndereco() {
    const { dadosPrestador, options } = this.state;
    options.dialogMessage = `Endereço:\n${
      dadosPrestador.localizacao.logradouro
    }, ${dadosPrestador.localizacao.numero}, ${
      dadosPrestador.localizacao.cidade
    }, ${dadosPrestador.localizacao.uf}, ${
      dadosPrestador.localizacao.complemento
        ? dadosPrestador.localizacao.complemento + ","
        : ""
    } ${dadosPrestador.localizacao.cep}`;
    options.title = `${dadosPrestador.localizacao.logradouro}, ${dadosPrestador.localizacao.numero}, ${dadosPrestador.localizacao.cidade}, ${dadosPrestador.localizacao.uf}, ${dadosPrestador.localizacao.cep}`;

    showLocation(options);
  }

  componentDidMount() {
    //  this.setState({ agends: this.props.agends });
    const { navigation } = this.props;

    this.setState({
      dadosPrestador: navigation.state.params.prestador,
    });

    console.log(this.state.dadosPrestador);
    this.getPrestador();
  }

  changeServico(servico) {
    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        servico: servico,
      },
    }));
  }

  newService() {
    const { agendamento, dadosNegocio } = this.state;

    agendamento.servico = dadosNegocio.servicos[0].servico;

    this.setState({
      showNewService: true,
    });
  }

  getByCep = async (cep) => {
    const { usuario, dadosNegocio } = this.state;
    try {
      const response = await apiEndereco.get(cep + "/json");
      this.setState((prev) => ({
        agendamento: {
          ...prev.agendamento,
          cpf_prop_estab: dadosNegocio.cpf_proprietario,
          cliente: {
            ...prev.agendamento.cliente,
            cpf: usuario.cpf,
            endereco: {
              ...prev.agendamento.cliente.endereco,
              cep: cep,
              logradouro: response.data.logradouro,
              bairro: response.data.bairro,
              uf: response.data.uf,
              cidade: response.data.localidade,
            },
          },
        },
      }));
    } catch (err) {
      console.log(err);
    }
  };

  getPrestador = async () => {
    const { navigation } = this.props;
    const { dadosPrestador } = this.state;
    console.log(dadosPrestador.cpf_proprietario);
    const usuario = JSON.parse(
      await AsyncStorage.getItem("@i9Servicos:userDados")
    );
    this.setState({ usuario: usuario, loading: true });

    try {
      const response = await apiNegocio.get(
        "estabelecimento/" + dadosPrestador.cpf_proprietario,
        {
          buscaCompleta: true,
        }
      );

      this.setState({
        dadosNegocio: response.data,
        loading: false,
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", JSON.stringify(err.data));
      this.setState({ loading: false });
    }
  };

  saveAgendamento = async () => {
    const { agendamento, usuario, dadosNegocio } = this.state;

    const dataAgendamento = new Date(agendamento.data_hora);
    const dataIni = new Date(
      dataAgendamento.getFullYear(),
      dataAgendamento.getMonth(),
      1
    );
    agendamento.data_hora = moment(new Date(agendamento.data_hora)).format(
      "YYYY-MM-DD HH:mm"
    );

    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        cpf_prop_estab: dadosNegocio.cpf_proprietario,
        cliente: {
          ...prev.agendamento.cliente,
          cpf: usuario.cpf,
        },
      },
    }));

    try {
      this.setState({ loading: true });
      const response = await apiAgendamento.post("agendamento", agendamento);
      console.log(response);
      this.setState({
        loading: false,
        showNewService: false,
      });
      Alert.alert("Salvo!", "Dados salvos com sucesso.");
      this.setState({
        agendamento: {
          cpf_prop_estab: dadosNegocio.cpf_proprietario,
          data_hora: new Date(),
          status: "PENDENTE",
          cliente: {
            endereco: {},
            cpf: usuario.cpf,
          },
          servico: {},
        },
      });
    } catch (err) {
      this.setState({ loading: false });
      Alert.alert("Erro", JSON.stringify(err.data));
      console.log(err);
    }
  };

  horaSelected(data) {
    this.setState({ showTimePicker: false });
    const { agendamento } = this.state;
    const dataAgendamento = new Date(agendamento.data_hora);
    const dataHora = new Date(data);
    dataAgendamento.setHours(dataHora.getHours(), dataHora.getMinutes());
    if (data) {
      this.setState((prev) => ({
        agendamento: {
          ...prev.agendamento,
          data_hora: dataAgendamento,
        },
      }));
    }
  }

  onChange = (date) => {
    this.setState({ showDatePicker: false });
    const { agendamento } = this.state;
    let dataAgendamento = new Date(agendamento.data_hora);
    const dataHora = new Date(date);

    dataAgendamento = new Date(
      dataHora.getFullYear(),
      dataHora.getMonth(),
      dataHora.getDate(),
      dataAgendamento.getHours(),
      dataAgendamento.getMinutes()
    );
    if (date) {
      this.setState((prev) => ({
        agendamento: {
          ...prev.agendamento,
          data_hora: dataAgendamento,
        },
      }));
    }
  };

  renderTelefones() {
    const { showTelefones, dadosNegocio } = this.state;

    return (
      <Modal
        animationType="slide"
        visible={showTelefones}
        onRequestClose={() => this.setState({ showTelefones: false })}
      >
        <Block>
          <Block flex={false} row center space="between" style={styles.header}>
            <Text h1 bold>
              Telefones
            </Text>
          </Block>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ paddingVertical: theme.sizes.base * 2 }}
          >
            <Block flex={false} row space="between" style={styles.agendamentos}>
              {dadosNegocio.contatos.length > 0 &&
                dadosNegocio.contatos.map((contato) => (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${contato.ddd}${contato.numero}`)
                    }
                    key={contato.id}
                  >
                    <Card
                      color="#fffcfc"
                      center
                      middle
                      shadow
                      style={styles.contato}
                    >
                      <Text center medium height={20}>
                        {contato.ddd} - {contato.numero}
                      </Text>
                      {contato.ind_whatsapp && (
                        <Text center medium color="green">
                          WhatsApp
                        </Text>
                      )}
                    </Card>
                  </TouchableOpacity>
                ))}
              {dadosNegocio.contatos.length === 0 && (
                <Block>
                  <Text style={{ marginBottom: 50 }} center medium height={20}>
                    Este prestador não tem nenhum telefone para contato.
                  </Text>
                </Block>
              )}
            </Block>
            <Button
              color="orange"
              onPress={() => this.setState({ showTelefones: false })}
            >
              <Text center white>
                Voltar
              </Text>
            </Button>
          </ScrollView>
        </Block>
      </Modal>
    );
  }

  renderCreateService() {
    const {
      showNewService,
      showDatePicker,
      agendamento,
      showTimePicker,
      showEndereco,
      loading,
      dadosNegocio,
    } = this.state;

    return (
      <Modal
        animationType="slide"
        visible={showNewService}
        onRequestClose={() => this.setState({ showNewService: false })}
      >
        <Block>
          <Block flex={false} row center space="between" style={styles.header}>
            <Text h1 bold>
              Agendar
            </Text>
          </Block>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Block style={styles.inputs}>
              <Block row space="between" margin={[10, 0]}>
                <Block>
                  <TouchableOpacity
                    onPress={() => this.setState({ showDatePicker: true })}
                  >
                    <Text gray2>Data</Text>
                    <Text>
                      {moment(new Date(agendamento.data_hora)).format(
                        "DD/MM/YYYY"
                      )}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={agendamento.data_hora}
                      mode="date"
                      display="default"
                      is24Hour={true}
                      onChange={(event, date) => this.onChange(date)}
                    />
                  )}
                </Block>
                <Block>
                  <TouchableOpacity
                    onPress={() => this.setState({ showTimePicker: true })}
                  >
                    <Text gray2>Hora</Text>
                    <Text>
                      {moment(new Date(agendamento.data_hora)).format("HH:mm")}
                    </Text>
                  </TouchableOpacity>
                  {showTimePicker && (
                    <DateTimePicker
                      value={agendamento.data_hora}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={(event, date) => this.horaSelected(date)}
                    />
                  )}
                </Block>
              </Block>
              <Block row space="between" margin={[10, 0]}>
                <Block>
                  <Text gray2>Serviço</Text>
                  <Picker
                    style={{
                      height: 50,
                      width: 300,
                    }}
                    selectedValue={agendamento.servico}
                    onValueChange={(v) => this.changeServico(v)}
                    itemStyle={{ fontSize: 20 }}
                  >
                    {dadosNegocio.servicos.map((servico) => (
                      <Picker.Item
                        key={`servico-${servico.servico.nome}`}
                        label={servico.servico.nome}
                        value={servico.servico}
                      />
                    ))}
                  </Picker>
                </Block>
              </Block>
              <Block flex={false} row space="between">
                <Text h3>Endereço</Text>
              </Block>
              {this.renderEnderecoCliente()}
              <Block middle padding={[theme.sizes.base / 2, 0]}>
                <Button gradient onPress={() => this.saveAgendamento()}>
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text bold white center>
                      Salvar
                    </Text>
                  )}
                </Button>
                <Button
                  color="orange"
                  onPress={() => this.setState({ showNewService: false })}
                >
                  <Text center white>
                    Voltar
                  </Text>
                </Button>
              </Block>
            </Block>
          </ScrollView>
        </Block>
      </Modal>
    );
  }

  renderEnderecoCliente() {
    const { agendamento, listaUF } = this.state;
    return (
      <Block>
        <Input
          label="CEP"
          style={[styles.input]}
          defaultValue={agendamento.cliente.endereco.cep}
          onBlur={() => this.getByCep(agendamento.cliente.endereco.cep)}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    cep: text,
                  },
                },
              },
            }))
          }
        />
        <Input
          label="Rua"
          number
          style={[styles.input]}
          defaultValue={agendamento.cliente.endereco.logradouro}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    logradouro: text,
                  },
                },
              },
            }))
          }
        />
        <Input
          label="Número"
          number
          style={[styles.input]}
          defaultValue={String(
            agendamento.cliente.endereco.numero
              ? agendamento.cliente.endereco.numero
              : ""
          )}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    numero: text,
                  },
                },
              },
            }))
          }
        />
        <Input
          label="Bairro"
          style={[styles.input]}
          defaultValue={agendamento.cliente.endereco.bairro}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    bairro: text,
                  },
                },
              },
            }))
          }
        />
        <Input
          label="Complemento"
          style={[styles.input]}
          defaultValue={agendamento.cliente.endereco.complemento}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    complemento: text,
                  },
                },
              },
            }))
          }
        />
        <Block>
          <Text gray2>Estado</Text>
          <Picker
            style={{
              height: 50,
              width: 150,
            }}
            selectedValue={agendamento.cliente.endereco.uf}
            onValue={(v) =>
              this.setState((prev) => ({
                agendamento: {
                  ...prev.agendamento,
                  cliente: {
                    ...prev.agendamento.cliente,
                    endereco: {
                      ...prev.agendamento.cliente.endereco,
                      uf: v,
                    },
                  },
                },
              }))
            }
            itemStyle={{ fontSize: 20 }}
          >
            {listaUF.map((uf) => (
              <Picker.Item key={`${uf}`} label={uf} value={uf} />
            ))}
          </Picker>
        </Block>
        <Input
          label="Cidade"
          style={[styles.input]}
          defaultValue={agendamento.cliente.endereco.cidade}
          onChangeText={(text) =>
            this.setState((prev) => ({
              agendamento: {
                ...prev.agendamento,
                cliente: {
                  ...prev.agendamento.cliente,
                  endereco: {
                    ...prev.agendamento.cliente.endereco,
                    cidade: text,
                  },
                },
              },
            }))
          }
        />
      </Block>
    );
  }

  renderServico(serv) {
    return (
      <Block row card shadow color="#fffcfc" style={styles.agend}>
        <Block flex={0.75} column middle>
          <Text h3 bold style={{ paddingVertical: 8 }}>
            {serv.servico.nome}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            {serv.servico.descricao}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            R$ {Number(serv.servico.preco).toFixed(2)}
          </Text>
        </Block>
      </Block>
    );
  }

  renderServicos() {
    const { navigation } = this.props;
    const { dadosNegocio } = this.state;
    return (
      <Block flex={0.8} column style={styles.agends}>
        <SafeAreaView style={styles.safe}>
          <Block flex={false} row space="between">
            <TouchableOpacity
              onPress={() => this.setState({ showTelefones: true })}
              key={"ajuda"}
            >
              <Card
                color="#fffcfc"
                center
                middle
                shadow
                style={styles.agendamento}
              >
                <Text medium height={20}>
                  Telefones
                </Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.openEndereco()} key={"teste"}>
              <Card
                color="#fffcfc"
                center
                middle
                shadow
                style={styles.agendamento}
              >
                <Text medium height={20}>
                  Endereço
                </Text>
              </Card>
            </TouchableOpacity>
          </Block>
          {dadosNegocio.servicos.map((serv) => (
            <TouchableOpacity activeOpacity={0.8} key={`serv-${serv.id}`}>
              {this.renderServico(serv)}
            </TouchableOpacity>
          ))}
          {dadosNegocio.servicos.length === 0 && (
            <Block>
              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Este prestador ainda não cadastrou nenhum serviço.
              </Text>
            </Block>
          )}
        </SafeAreaView>
      </Block>
    );
  }

  render() {
    const { profile, navigation } = this.props;
    const { loading, dadosPrestador, dadosNegocio } = this.state;
    return (
      <Block>
        <Block flex={false} row center space="between" style={styles.header}>
          <Text h1 bold>
            {dadosPrestador.nome}
          </Text>
          <Button onPress={() => navigation.navigate("Settings")}>
            <Image source={profile.avatar} style={styles.avatar} />
          </Button>
        </Block>
        <ScrollView showsHorizontalScrollIndicator={false}>
          <Block style={styles.header}>
            {dadosNegocio.horario_atendimento.map((horario) => (
              <Block key={horario.dia_semana}>
                {horario.aberto ? (
                  <Text center>
                    {horario.dia_semana}: {horario.inicio_atendimento} até{" "}
                    {horario.fim_atendimento}
                  </Text>
                ) : (
                  <Text center>{horario.dia_semana}: Não trabalha</Text>
                )}
              </Block>
            ))}
          </Block>
          {loading ? (
            <ActivityIndicator size="large" color="green" />
          ) : (
            this.renderServicos()
          )}
        </ScrollView>
        <TouchableOpacity onPress={() => this.newService()} style={styles.fab}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
        {this.renderCreateService()}
        {this.renderTelefones()}
      </Block>
    );
  }
}

PrestadorHome.defaultProps = {
  profile: mocks.profile,
};

export default PrestadorHome;

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
