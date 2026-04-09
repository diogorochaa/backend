package Aula10;

public abstract class Pessoa {
  private String nome;
  private String idade;
  private String sexo;

  public void fazerAniversario() {
    System.out.println("Feliz aniversário!");
  }

  public String getNome() {
    return nome;
  }

  public String getIdade() {
    return idade;
  }

  public String getSexo() {
    return sexo;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public void setIdade(String idade) {
    this.idade = idade;
  }

  public void setSexo(String sexo) {
    this.sexo = sexo;
  }

  @Override
  public String toString() {
    return "Pessoa{" + "nome=" + nome + ", idade=" + idade + ", sexo=" + sexo + '}';
  }
}