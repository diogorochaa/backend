package Aula10;

public class Aluno extends Pessoa {
  private int matricula;
  private String curso;

  public void pagarMensalidade() {
    System.out.println("Pagando mensalidade do aluno " + this.getNome());
  }

  public int getMatricula() {
    return matricula;
  }

  public String getCurso() {
    return curso;
  }

  public void setMatricula(int matricula) {
    this.matricula = matricula;
  }

  public void setCurso(String curso) {
    this.curso = curso;
  }

  @Override
  public String toString() {
    return "Aluno{" + "matricula=" + matricula + ", curso=" + curso + '}';
  }

}
