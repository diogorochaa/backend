package Aula09;

public class Funcionario extends Pessoa {
  private String setor;
  private boolean trabalhando;

  public void mudarTrabalho() {
    this.setTrabalhando(!this.getTrabalhando());
  }

  public String getSetor() {
    return this.setor;
  }

  public boolean getTrabalhando() {
    return this.trabalhando;
  }

  public void setSetor(String setor) {
    this.setor = setor;
  }

  public void setTrabalhando(boolean trabalhando) {
    this.trabalhando = trabalhando;
  }

}
