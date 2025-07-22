
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CalculatorModal({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const handleInput = (value: string) => {
    if (result) {
      setInput(result + value);
      setResult('');
    } else {
      setInput(input + value);
    }
  };

  const calculateResult = () => {
    try {
      // Using a function constructor for safe evaluation of math expressions.
      // It's safer than eval() but should still be used with caution.
      const calculatedResult = new Function('return ' + input)();
      setResult(String(calculatedResult));
    } catch (error) {
      setResult('Error');
    }
  };

  const clearInput = () => {
    setInput('');
    setResult('');
  };

  const backspace = () => {
    if (result) {
      clearInput();
    } else {
      setInput(input.slice(0, -1));
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
  ];

  const handleButtonClick = (btn: string) => {
    if (btn === '=') {
      calculateResult();
    } else if (['+', '-', '*', '/'].includes(btn)) {
      handleInput(btn);
    } else {
      if (result) {
          setInput(btn);
          setResult('');
      } else {
          setInput(input + btn);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            readOnly
            value={result || input || '0'}
            className="h-16 text-3xl font-bold text-right pr-4"
          />
          <div className="grid grid-cols-4 gap-2">
             <Button variant="outline" className="col-span-2 h-16 text-xl" onClick={clearInput}>C</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={backspace}>&larr;</Button>

            {buttons.map((btn) => (
              <Button
                key={btn}
                variant={btn === "=" ? "default" : "outline"}
                className="h-16 text-xl"
                onClick={() => handleButtonClick(btn)}
              >
                {btn}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
