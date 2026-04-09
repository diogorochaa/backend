package Aula07;

public class Lutador {
  private String nome;
  private String nacionalidade;
  private int idade;
  private float altura;
  private float peso;
  private String categoria;
  private int vitorias;
  private int derrotas;
  private int empates;

  public Lutador(String nome, String nacionalidade, int idade, float altura, float peso, int vitorias, int derrotas,
      int empates) {
    this.nome = nome;
    this.nacionalidade = nacionalidade;
    this.idade = idade;
    this.altura = altura;
    this.setPeso(peso);
    this.vitorias = vitorias;
    this.derrotas = derrotas;
    this.empates = empates;
  }

  public void apresentar() {
    System.out.println("Lutador: " + this.getNome());
    System.out.println("Origem: " + this.getNacionalidade());
    System.out.println(this.getIdade() + " anos");
    System.out.println(this.getAltura() + "m de altura");
    System.out.println("Pesando " + this.getPeso() + "Kg");
    System.out.println("Ganhou: " + this.getVitorias());
    System.out.println("Perdeu: " + this.getDerrotas());
    System.out.println("Empatou: " + this.getEmpates());
  }

  public void status() {
    System.out.println(this.getNome());
    System.out.println("É um peso " + this.getCategoria());
    System.out.println(this.getVitorias() + " vitórias");
    System.out.println(this.getDerrotas() + " derrotas");
    System.out.println(this.getEmpates() + " empates");
  }

  public void ganharLuta() {
    this.setVitorias(this.getVitorias() + 1);
  }

  public void perderLuta() {
    this.setDerrotas(this.getDerrotas() + 1);
  }

  public void empatarLuta() {
    this.setEmpates(this.getEmpates() + 1);
  }

  public String getNome() {
    return this.nome;
  }

  public String getNacionalidade() {
    return this.nacionalidade;
  }

  public int getIdade() {
    return this.idade;
  }

  public float getAltura() {
    return this.altura;
  }

  public float getPeso() {
    return this.peso;
  }

  public String getCategoria() {
    return this.categoria;
  }

  public int getVitorias() {
    return this.vitorias;
  }

  public int getDerrotas() {
    return this.derrotas;
  }

  public int getEmpates() {
    return this.empates;
  }

  public void setNome(String nome) {
    this.nome = nome;
  }

  public void setNacionalidade(String nacionalidade) {
    this.nacionalidade = nacionalidade;
  }

  public void setIdade(int idade) {
    this.idade = idade;
  }

  public void setAltura(float altura) {
    this.altura = altura;
  }

  public void setPeso(float peso) {
    this.peso = peso;
    this.setCategoria();
  }

  private void setCategoria() {
    if (this.getPeso() < 52.2) {
      this.categoria = "Inválido";
    } else if (this.getPeso() <= 70.3) {
      this.categoria = "Leve";
    } else if (this.getPeso() <= 83.9) {
      this.categoria = "Médio";
    } else if (this.getPeso() <= 120.2) {
      this.categoria = "Pesado";
    } else {
      this.categoria = "Inválido";
    }
  }

  public void setVitorias(int vitorias) {
    this.vitorias = vitorias;
  }

  public void setDerrotas(int derrotas) {
    this.derrotas = derrotas;
  }

  public void setEmpates(int empates) {
    this.empates = empates;
  }
}
