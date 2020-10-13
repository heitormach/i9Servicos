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
} from "react-native";

import { Button, Block, Text, Input } from "../components";
import { theme, mocks } from "../constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-community/picker";
import moment from "moment";
const { width } = Dimensions.get("window");
import apiAgendamento from "../services/apiAgendamento";
import apiNegocio from "../services/apiNegocio";
import { AsyncStorage } from "react-native";
import apiEndereco from "../services/apiEndereco";


class Agendamento extends Component {
  state = {
    agendamentos: [],
    agendamento: {
      cpf_prop_estab: null,
      data_hora: new Date(),
      status: "PENDENTE",
      cliente: {
        endereco: {},
      },
      servico: {},
    },
    agendamentoSelected: {},
    usuario: {},
    meses: [
      { nome: "Janeiro", numero: 1 },
      { nome: "Fevereiro", numero: 2 },
      { nome: "Março", numero: 3 },
      { nome: "Abril", numero: 4 },
      { nome: "Maio", numero: 5 },
      { nome: "Junho", numero: 6 },
      { nome: "Julho", numero: 7 },
      { nome: "Agosto", numero: 8 },
      { nome: "Setembro", numero: 9 },
      { nome: "Outubro", numero: 10 },
      { nome: "Novembro", numero: 11 },
      { nome: "Dezembro", numero: 12 },
    ],
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
    mesSelected: new Date().getMonth() + 1,
    servicos: [],
    servicoSelected: {},
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
  };

  componentDidMount() {
    //  this.setState({ agends: this.props.agends });
    const { dataInicio, dataFim } = this.state;
    const { navigation } = this.props;

    this.getAgendamentos("", dataInicio, dataFim);
    this.getServicos();

    navigation.addListener("willFocus", () => {
      this.getAgendamentos("", dataInicio, dataFim);
      this.getServicos();
    });
  }

  convertData(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  changeServico(servico) {
    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        servico: servico,
      },
    }));
  }

  getByCep = async (cep) => {
    const { usuario } = this.state;
    try {
      const response = await apiEndereco.get(cep + "/json");
      this.setState((prev) => ({
        agendamento: {
          ...prev.agendamento,
          cliente: {
            ...prev.agendamento.cliente,
            endereco: {
              ...prev.agendamento.cliente.endereco,
              cep: cep,
              logradouro: response.data.logradouro,
              bairro: response.data.bairro,
              uf: response.data.uf,
              cidade: response.data.localidade,
              cpf_proprietario: usuario.cpf,
            },
          },
        },
      }));
    } catch (err) {
      console.log(err);
    }
  };

  getAgendamentos = async (status, dataInicio, dataFim) => {
    const usuario = JSON.parse(await AsyncStorage.getItem("@i9App:userDados"));
    this.setState((prev) => ({
      agendamento: {
        ...prev.agendamento,
        cpf_prop_estab: usuario.cpf,
      },
    }));
    this.setState({ usuario: usuario });
    try {
      this.setState({ loading: true });
      const response = await apiAgendamento.get("agendamento", {
        cpfPropEstab: usuario.cpf,
        dataInicio: this.convertData(dataInicio),
        dataFim: this.convertData(dataFim),
        status: status,
      });

      this.setState({ agendamentos: response.data, loading: false });
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", JSON.stringify(err.data));
      this.setState({ loading: false });
    }
  };

  getServicos = async () => {
    const { navigation } = this.props;
    const usuario = JSON.parse(await AsyncStorage.getItem("@i9App:userDados"));
    this.setState({ usuario: usuario });

    try {
      const response = await apiNegocio.get("estabelecimento/servico", {
        cpfProprietario: usuario.cpf,
      });

      if (response.data.length === 0) {
        Alert.alert(
          "Atenção",
          "Para utilizar o serviço de agendamento, \nvocê deve primeiro atualizar os dados\n do seu negócio e cadastrar um serviço.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Servicos");
              },
            },
          ]
        );
      }
      if (response.data.length > 0) {
        this.setState((prev) => ({
          servicos: response.data,
          agendamento: {
            ...prev.agendamento,
            servico: response.data[0].servico,
          },
        }));
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", JSON.stringify(err.data));
    }
  };

  saveAgendamento = async () => {
    const { agendamento } = this.state;
    console.log(JSON.stringify(agendamento));
    const dataAgendamento = new Date(agendamento.data_hora);
    const dataIni = new Date(
      dataAgendamento.getFullYear(),
      dataAgendamento.getMonth(),
      1
    );
    const dataFim = new Date(
      dataAgendamento.getFullYear(),
      dataAgendamento.getMonth() + 1,
      0
    );

    agendamento.data_hora = moment(new Date(agendamento.data_hora)).format(
      "YYYY-MM-DD HH:mm"
    );

    try {
      this.setState({ loading: true });
      const response = await apiAgendamento.post("agendamento", agendamento);
      this.setState({
        loading: false,
        showNewService: false,
        mesSelected: dataIni.getMonth() + 1,
      });
      Alert.alert("Salvo!", "Dados salvos com sucesso.");
      this.getAgendamentos("", dataIni, dataFim);
      this.setState({
        agendamento: {
          cpf_prop_estab: null,
          data_hora: new Date(),
          status: "PENDENTE",
          cliente: {
            endereco: {},
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

  onChangeMonth(month) {
    this.setState({ mesSelected: month });
    const dateParam = new Date();
    this.getAgendamentos(
      "",
      new Date(dateParam.getFullYear(), month - 1, 1),
      new Date(dateParam.getFullYear(), month, 0)
    );
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

  renderCreateService() {
    const {
      showNewService,
      servicos,
      showDatePicker,
      agendamento,
      showTimePicker,
      showEndereco,
      loading,
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
              Agendamento
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
                    {servicos.map((servico) => (
                      <Picker.Item
                        key={`servico-${servico.servico.nome}`}
                        label={servico.servico.nome}
                        value={servico.servico}
                      />
                    ))}
                  </Picker>
                </Block>
              </Block>
              <Block>
                <Input
                  label="Nome do Cliente"
                  style={[styles.input]}
                  defaultValue={agendamento.cliente.nome}
                  onChangeText={(text) =>
                    this.setState((prev) => ({
                      agendamento: {
                        ...prev.agendamento,
                        cliente: { ...prev.agendamento.cliente, nome: text },
                      },
                    }))
                  }
                />
                <Input
                  label="CPF (Opcional)"
                  style={[styles.input]}
                  defaultValue={agendamento.cliente.cpf}
                  onChangeText={(text) =>
                    this.setState((prev) => ({
                      agendamento: {
                        ...prev.agendamento,
                        cliente: { ...prev.agendamento.cliente, cpf: text },
                      },
                    }))
                  }
                />
              </Block>
              {showEndereco && (
                <Block flex={false} row space="between">
                  <Text h3>Endereço do Cliente</Text>
                </Block>
              )}
              {showEndereco && this.renderEnderecoCliente()}
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
                  color="secondary"
                  onPress={() => this.setState({ showEndereco: !showEndereco })}
                >
                  <Text center white>
                    Endereço do Cliente
                  </Text>
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

  renderAgend(agend) {
    return (
      <Block row card shadow color="#fffcfc" style={styles.agend}>
        <Block
          flex={0.25}
          card
          column
          color="secondary"
          style={styles.agendStatus}
        >
          <Block flex={0.25} middle center color={theme.colors.primary}>
            <Text h2 white style={{ textTransform: "uppercase" }}>
              Dia
            </Text>
          </Block>
          <Block flex={0.7} center middle>
            <Text h2 white>
              {new Date(agend.data_agendamento.substring(0, 10)).getDate() + 1}
            </Text>
          </Block>
        </Block>
        <Block flex={0.75} column middle>
          <Text h3 style={{ paddingVertical: 8 }}>
            Serviços: {agend.quantidade_servicos}
          </Text>
          <Text h4 style={{ paddingVertical: 8 }}>
            (Aperte para visualizar)
          </Text>
        </Block>
      </Block>
    );
  }

  renderAgends() {
    const { navigation } = this.props;
    const { agendamentos } = this.state;
    return (
      <Block flex={0.8} column style={styles.agends}>
        <SafeAreaView style={styles.safe}>
          {agendamentos.map((agend) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ServicosDia", { servsDia: agend })
              }
              activeOpacity={0.8}
              key={`agend-${agend.data_agendamento}`}
            >
              {this.renderAgend(agend)}
            </TouchableOpacity>
          ))}
          {agendamentos.length === 0 && (
            <Block>
              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Aqui você pode agendar e gerenciar os agendamentos de serviços
                feitos por você ou pelos seus clientes.
              </Text>

              <Text style={{ marginBottom: 50 }} center medium height={20}>
                Nenhum serviço encontrado no mês
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
    const { meses, mesSelected, loading } = this.state;
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
        <Block flex={false} row space="between" style={styles.agendHeader}>
          <Picker
            style={{
              height: 50,
              width: 200,
              transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
            }}
            selectedValue={mesSelected}
            onValueChange={(v) => this.onChangeMonth(v)}
            itemStyle={{ fontSize: 20 }}
          >
            {meses.map((mes) => (
              <Picker.Item
                key={`mes-${mes.numero}`}
                label={mes.nome}
                value={mes.numero}
              />
            ))}
          </Picker>
        </Block>
        <ScrollView showsHorizontalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="green" />
          ) : (
            this.renderAgends()
          )}
        </ScrollView>
        <TouchableOpacity
          onPress={() => this.setState({ showNewService: true })}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
        {this.renderCreateService()}
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
