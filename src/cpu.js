/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Instructions

const HLT = 0b00011011; // Halt CPU
const LDI = 0b00000100; // Load Immediately
const MUL = 0b00000101; // Multiply
const PRN = 0b00000110; // Print

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {
  /**
   * Initialize the CPU
   */
  constructor(ram) {
    this.ram = ram;

    this.reg = new Array(8).fill(0); // General-purpose registers

    // Special-purpose registers
    this.reg.PC = 0; // Program Counter
    this.reg.IR = 0; // Instruction Register

    this.setupBranchTable();
  }

  /**
   * Sets up the branch table
   */
  setupBranchTable() {
    let bt = {};

    bt[HLT] = this.HLT;
    bt[LDI] = this.LDI;
    bt[MUL] = this.MUL;
    bt[PRN] = this.PRN;

    this.branchTable = bt;
  }

  /**
   * Store value in memory address, useful for program loading
   */
  poke(address, value) {
    this.ram.write(address, value);
  }

  /**
   * Starts the clock ticking on the CPU
   */
  startClock() {
    const _this = this;

    this.clock = setInterval(() => {
      _this.tick();
    }, 1);
  }

  /**
   * Stops the clock
   */
  stopClock() {
    clearInterval(this.clock);
  }

  /**
   * ALU functionality
   * op can be: ADD SUB MUL DIV INC DEC CMP
   */
  alu(op, regA, regB) {
    let valA = this.reg[regA];
    let valB = this.reg[regB];

    switch (op) {
      case 'MUL':
        this.reg[regA] = (valA * valB) & 0b11111111;
        break;
    }
  }

  /**
   * Advances the CPU one cycle
   */
  tick() {
    // Load the instruction register from the current PC
    this.reg.IR = this.ram.read(this.reg.PC);
    // Debugging output
    //console.log(`${this.reg.PC}: ${this.reg.IR.toString(2)}`);

    // Based on the value in the Instruction Register, jump to the
    // appropriate hander in the branchTable
    const handler = this.branchTable[this.reg.IR];
    // Check that the handler is defined, halt if not (invalid
    // instruction)
    if (!handler) {
      console.error(`invalid instruction at ${this.reg.PC} : ${this.reg.IR}`);
      this.stopClock();
      return;
    }
    // We need to use call() so we can set the "this" value inside
    // the handler (otherwise it will be undefined in the handler)
    handler.call(this);
  }

  // INSTRUCTION HANDLER CODE:

  /**
   * HLT
   */
  HLT() {
    this.stopClock();
  }

  /**
   * LDI R,I
   */
  LDI() {
    const regA = this.ram.read(this.reg.PC + 1);
    const immediate = this.ram.read(this.reg.PC + 2);

    this.reg[regA] = immediate;
    this.reg.PC += 3;
  }

  /**
   * MUL R,R
   */
  MUL() {
    const regA = this.ram.read(this.reg.PC + 1);
    const regB = this.ram.read(this.reg.PC + 2);

    this.alu('MUL', regA, regB);
    this.reg.PC += 3;
  }

  /**
   * PRN R
   */
  PRN() {
    const regA = this.ram.read(this.reg.PC + 1);
    console.log(this.reg[regA]);

    this.reg.PC += 2;
  }
}

module.exports = CPU;
