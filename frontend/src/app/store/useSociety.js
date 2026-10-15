import { useContext } from 'react';
import { SocietyContext } from './society.context';

export default function useSociety() {
  const context = useContext(SocietyContext);
  if (!context) throw new Error('useSociety must be used inside <SocietyProvider>');
  return context;
}
