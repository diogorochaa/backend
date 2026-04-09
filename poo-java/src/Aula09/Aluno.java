package Aula09;

public class Aluno extends Pessoa {
  private int matricula;
  private String curso;

  public void cancelarMatricula() {
    System.out.println("Matrícula será cancelada!");
  }

  public int getMatricula() {
    return this.matricula;
  }

  public String getCurso() {
    return this.curso;
  }

  public void setMatricula(int matricula) {
    this.matricula = matricula;
  }

  public void setCurso(String curso) {
    this.curso = curso;
  }

}
