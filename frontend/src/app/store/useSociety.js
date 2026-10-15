import { useContext } from 'react';
import { SocietyContext } from './society.context';

export function useSociety() {
  return useContext(SocietyContext);
}

export default useSociety;
