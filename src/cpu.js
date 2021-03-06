/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Special Registers
const IM = 5; // R5 = Interrupt Mask (IM)
const IS = 6; // R6 = Interrupt Status (IS)
const SP = 7; // R7 = Stack Pointer (SP)

// Instructions
const HLT = 0b00011011;
const ADD = 0b00001100;
const CALL = 0b00001111;
const IRET = 0b00011010;
const JMP = 0b00010001;
const LDI = 0b00000100;
const MUL = 0b00000101;
const NOP = 0b00000000;
const PRA = 0b00000111;
const PRN = 0b00000110;
const POP = 0b00001011;
const PUSH = 0b00001010;
const RET = 0b00010000;
const ST = 0b00001001;
const CMP = 0b00010110;
const JEQ = 0b00010011;
const JNE = 0b00010100;

class CPU {
  constructor(ram) {
    this.ram = ram;

    this.reg = new Array(8).fill(0); // General-purpose registers

    this.reg[SP] = 0xf8;

    // Special-purpose registers
    this.reg.PC = 0; // Program Counter
    this.reg.IR = 0; // Instruction Register

    this.flags = {
      interruptsEnabled: true,
      equal: null
    };

    this.setupBranchTable();
  }

  setupBranchTable() {
    let bt = {};

    bt[HLT] = this.HLT;
    bt[LDI] = this.LDI;
    bt[MUL] = this.MUL;
    bt[PRN] = this.PRN;
    bt[ADD] = this.ADD;
    bt[CALL] = this.CALL;
    bt[POP] = this.POP;
    bt[PUSH] = this.PUSH;
    bt[RET] = this.RET;
    bt[JMP] = this.JMP;
    bt[ST] = this.ST;
    bt[PRA] = this.PRA;
    bt[IRET] = this.IRET;
    bt[NOP] = this.NOP;
    bt[CMP] = this.CMP;
    bt[JEQ] = this.JEQ;
    bt[JNE] = this.JNE;

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

    this.timerHandle = setInterval(() => {
      // Trigger timer interrupt
      // e.g.-set bit 0 of IS to 1
      // this.reg[IS] = this.reg[IS] | 0b00000001;
      this.reg[IS] |= 0b00000001;
    }, 1000);
  }

  /**
   * Stops the clock
   */
  stopClock() {
    clearInterval(this.clock);
    clearInterval(this.timerHandle);
  }
  alu(op, regA, regB) {
    let valA = this.reg[regA];
    let valB = this.reg[regB];

    switch (op) {
      case 'MUL':
        this.reg[regA] = (valA * valB) & 255;
        break;
      case 'ADD':
        this.reg[regA] = (valA + valB) & 255;
        break;
    }
  }

  /**
   * Advances the CPU one cycle
   */
  tick() {
    // Check IS (R6) if an interrupt happened
    // if it did, jump to that interrupt handler
    const maskedInterrupts = this.reg[IS] & this.reg[IM];
    if (this.flags.interruptsEnabled && maskedInterrupts) {
      for (let i = 0; i < 8; i++) {
        if (((maskedInterrupts >> i) & 1) == 1) {
          // Handling interrupt
          this.flags.interruptsEnabled = false;

          // console.log("this.reg[IS] before: " + parseInt(this.reg[IS], 2));
          // Clear ith bit in IS reg
          this.reg[IS] = this.reg[IS] & ~(1 << i);

          // Push PC on stack
          this.reg[SP]--; // dec R7 (SP)
          this.ram.write(this.reg[SP], this.reg.PC);

          // Push remaining registers on the stack
          for (let j = 0; j < 8; j++) {
            this.reg[SP]--;
            this.ram.write(this.reg[SP], this.reg[j]);
          }

          // Look up the handler address in the interrupt vector table
          const vectorTableEntry = 0xf8 + i;
          const handlerAddress = this.ram.read(vectorTableEntry);

          // Set PC to handler
          this.reg.PC = handlerAddress;

          // console.log("handling interrupt! " + this.reg[IS] + " " + i);
          break;
        }
      }
      // this.reg[IS] = 0;
    }

    // Load the instruction register from the current PC
    this.reg.IR = this.ram.read(this.reg.PC);
    // Based on the value in the Instruction Register, jump to the
    // appropriate hander in the branchTable
    const handler = this.branchTable[this.reg.IR];
    if (!handler) {
      console.error(
        `Invalid instruction at address ${this.reg.PC}: ${this.reg.IR.toString(
          2
        )}`
      );
      this.stopClock();
      return;
    }
    handler.call(this);
  }

  // INSTRUCTION HANDLER CODE:

  ADD() {
    const regA = this.ram.read(this.reg.PC + 1);
    const regB = this.ram.read(this.reg.PC + 2);

    this.alu('ADD', regA, regB);

    this.reg.PC += 3; // move PC
  }
  CALL() {
    const regA = this.ram.read(this.reg.PC + 1);

    // Push address of next instruction on stack
    this.reg[SP]--; // dec R7 (SP reg)
    this.ram.write(this.reg[SP], this.reg.PC + 2);

    // Jump to the address stored in regA
    this.reg.PC = this.reg[regA];
  }
  CMP() {
    const regA = this.ram.read(this.reg.PC + 1);
    const regB = this.ram.read(this.reg.PC + 2);

    // regA AND inverseOf(regB)
    if ((this.reg[regA] & ~this.reg[regB]) === 0) {
      this.flags.equal = true;
    } else this.flags.equal = false;

    this.reg.PC += 3;
  }
  HLT() {
    this.stopClock();
  }
  LDI() {
    const regA = this.ram.read(this.reg.PC + 1);
    const val = this.ram.read(this.reg.PC + 2);

    this.reg[regA] = val;
    this.reg.PC += 3;
  }
  MUL() {
    const regA = this.ram.read(this.reg.PC + 1);
    const regB = this.ram.read(this.reg.PC + 2);

    this.alu('MUL', regA, regB);

    this.reg.PC += 3;
  }
  PRA() {
    const regA = this.ram.read(this.reg.PC + 1);
    console.log(String.fromCharCode(this.reg[regA]));

    this.reg.PC += 2;
  }
  PRN() {
    const regA = this.ram.read(this.reg.PC + 1);
    console.log(this.reg[regA]);

    this.reg.PC += 2;
  }
  POP() {
    const regA = this.ram.read(this.reg.PC + 1);
    const stackVal = this.ram.read(this.reg[SP]);

    this.reg[regA] = stackVal;

    this.reg[SP]++;
    this.reg.PC += 2;
  }
  PUSH() {
    const regA = this.ram.read(this.reg.PC + 1);

    this.reg[SP]--;
    this.ram.write(this.reg[SP], this.reg[regA]);

    this.reg.PC += 2;
  }
  IRET() {
    // Pop registers off the stack
    for (let j = 7; j >= 0; j--) {
      this.reg[j] = this.ram.read(this.reg[SP]);
      this.reg[SP]++;
    }
    // Pop PC off stack
    this.reg.PC = this.ram.read(this.reg[SP]);
    this.reg[SP]++;
    // Re-enable interrupts
    this.flags.interruptsEnabled = true;
  }
  RET() {
    this.reg.PC = this.ram.read(this.reg[SP]);

    this.reg[SP]++;
  }
  ST() {
    const regA = this.ram.read(this.reg.PC + 1);
    const regB = this.ram.read(this.reg.PC + 2);

    this.ram.write(this.reg[regA], this.reg[regB]);
    this.reg.PC += 3;
  }
  JMP() {
    const regA = this.ram.read(this.reg.PC + 1);

    this.reg.PC = this.reg[regA];
  }
  JEQ() {
    if (this.flags.equal) {
      const regA = this.ram.read(this.reg.PC + 1);
      this.reg.PC = this.reg[regA];
    } else {
      this.reg.PC += 2;
    }
  }
  JNE() {
    if (this.flags.equal === false) {
      const regA = this.ram.read(this.reg.PC + 1);
      this.reg.PC = this.reg[regA];
    } else {
      this.reg.PC += 2;
    }
  }
}

module.exports = CPU;
