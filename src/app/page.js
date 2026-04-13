import { redirect } from 'next/navigation';

export default function Home() {
  // Hard redirect the root domain instantly into the secure SaaS calculator
  redirect('/calculator');
}
