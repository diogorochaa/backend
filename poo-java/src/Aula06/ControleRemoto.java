package Aula06;

public class ControleRemoto implements Controlador {
  private int volume;
  private boolean ligado;
  private boolean tocando;

  public ControleRemoto() {
    this.volume = 50;
    this.ligado = false;
    this.tocando = false;
  }

  private int getVolume() {
    return this.volume;
  }

  private void setVolume(int volume) {
    this.volume = volume;
  }

  private boolean getLigado() {
    return this.ligado;
  }

  private void setLigado(boolean ligado) {
    this.ligado = ligado;
  }

  private boolean getTocando() {
    return this.tocando;
  }

  private void setTocando(boolean tocando) {
    this.tocando = tocando;
  }

  @Override
  public void ligar() {
    setLigado(true);
  }

  @Override
  public void desligar() {
    setLigado(false);
  }

  @Override
  public void abrirMenu() {
    System.out.println("----- MENU -----");
    System.out.println("Está ligado? " + getLigado());
    System.out.println("Está tocando? " + getTocando());
    System.out.print("Volume: " + getVolume());
    for (int i = 0; i < getVolume(); i += 10) {
      System.out.print("|");
    }
    System.out.println();
  }

  @Override
  public void fecharMenu() {
    System.out.println("Fechando menu...");
  }

  @Override
  public void maisVolume() {
    if (this.getLigado()) {
      setVolume(getVolume() + 5);
    } else {
      System.out.println("Impossível aumentar volume.");
    }
  }

  @Override
  public void menosVolume() {
    if (this.getLigado()) {
      setVolume(getVolume() - 5);
    } else {
      System.out.println("Impossível diminuir volume.");
    }
  }

  @Override
  public void ligarMudo() {
    if (this.getLigado() && this.getVolume() > 0) {
      setVolume(0);
    }
  }

  @Override
  public void desligarMudo() {
    if (this.getLigado() && this.getVolume() == 0) {
      setVolume(50);
    }
  }

  @Override
  public void play() {
    if (this.getLigado() && !(this.getTocando())) {
      setTocando(true);
    }
  }

  @Override
  public void pause() {
    if (this.getLigado() && this.getTocando()) {
      setTocando(false);
    }
  }

}
