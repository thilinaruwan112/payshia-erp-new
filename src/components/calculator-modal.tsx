
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

  const handleButtonClick = (value: string) => {
    if (result) {
        setResult('');
    }

    if (value === '=') {
      if (input === '') return;
      try {
        // Using a function constructor for safe evaluation of math expressions.
        const calculatedResult = new Function('return ' + input.replace(/[^0-9%^* /()\-+.]/g, ''))();
        setResult(String(calculatedResult));
        setInput(String(calculatedResult));
      } catch (error) {
        setResult('Error');
        setInput('');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else if (value === '<-') {
        if (result) {
            setInput('');
            setResult('');
        } else {
            setInput(input.slice(0, -1));
        }
    } else {
        if (result) {
            setInput(value);
            setResult('');
        } else {
            setInput(input + value);
        }
    }
  };


  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
  ];


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
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('C')}>C</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('<-')}>&larr;</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('/')}>/</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('*')}>*</Button>
             
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('7')}>7</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('8')}>8</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('9')}>9</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('-')}>-</Button>

             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('4')}>4</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('5')}>5</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('6')}>6</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('+')}>+</Button>

             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('1')}>1</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('2')}>2</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('3')}>3</Button>
             <Button variant="default" className="row-span-2 h-auto text-xl" onClick={() => handleButtonClick('=')}>=</Button>
             
             <Button variant="outline" className="col-span-2 h-16 text-xl" onClick={() => handleButtonClick('0')}>0</Button>
             <Button variant="outline" className="h-16 text-xl" onClick={() => handleButtonClick('.')}>.</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
