package Aula09;

public class Pessoa {
  private String nome;
  private int idade;
  private String sexo;

  public void fazerAniversario() {
    this.setIdade(this.getIdade() + 1);
  }

  public String getNome() {
    return this.nome;
  }

  public int getIdade() {
    return this.idade;
  }

  public String getSexo() {
    return this.sexo;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public void setIdade(int idade) {
    this.idade = idade;
  }

  public void setSexo(String sexo) {
    this.sexo = sexo;
  }

}
