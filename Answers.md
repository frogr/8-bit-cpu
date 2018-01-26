# Binary, Decimal, and Hex

**Convert `11001111` binary**

    to hex: CF

    to decimal: 207

**Convert 4C hex**

    to binary: 1001100

    to decimal: 76

**Convert 68 decimal**

    to binary: 1000100

    to hex: 44

# Architecture

Explain how the CPU provides concurrency:
The CPU provides concurrency by computing multiple processes during the same slices of time. While in a single-core processor, only one computation may happen in any given instant, but the lifetime processes may still overlap (even if the execution doesn't happen at the exact same instant, like in multi-core processors)

Describe assembly language and machine language:
Assembly language is a direct translation from machine language. It uses letters (usually in abbreviations, like LD for 'load') to make machine language more human readable. In our projects from this week, the assembly language would be commands like: `LDI R0,R8` while the machine language would be:
`00000100 00000000 00001000`

Suggest the role that graphics cards play in machine learning:
GPU Computing is much much faster than the CPU alone. Using GPU acceleration, neural network training is from 10 up to 20 times faster than using the CPU. This reduces training from days or weeks to just hours. That allows researchers and data scientists to build larger and more sophisticated neural networks, as well as potentially increasing application intelligence and accuracy.
