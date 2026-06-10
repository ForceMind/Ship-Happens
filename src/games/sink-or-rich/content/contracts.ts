import { Cargo, Contract, Port } from '../types';

export function createContractKey(contract: Pick<Contract, 'destinationPortId' | 'requiredCargoName' | 'requiredAmount'>): string {
  return `${contract.destinationPortId || ''}:${contract.requiredCargoName}:${contract.requiredAmount}`;
}

export function generateLocalContracts(currentPort: Port, unlockedPorts: string[], allPorts: Port[], cargoTypes: Cargo[]): Contract[] {
  const availableDestinations = allPorts.filter(port => port.id !== currentPort.id && unlockedPorts.includes(port.id));
  const localCargoTypes = cargoTypes.filter(cargo => !cargo.availableInPorts || cargo.availableInPorts.includes(currentPort.id));
  const destinations = availableDestinations.length > 0 ? availableDestinations : allPorts;
  const cargoPool = localCargoTypes.length > 0 ? localCargoTypes : cargoTypes;
  const generated: Contract[] = [];
  const usedContractKeys = new Set<string>();

  for (let i = 1; generated.length < 3 && i <= 30; i += 1) {
    const dest = destinations[Math.floor(Math.random() * destinations.length)];
    const cargo = cargoPool[Math.floor(Math.random() * cargoPool.length)];
    const amount = Math.floor(Math.random() * 3) + 1;
    const contractKey = `${dest.id}:${cargo.name}:${amount}`;
    if (usedContractKeys.has(contractKey)) continue;

    usedContractKeys.add(contractKey);
    let reward = 300 * amount;
    if (cargo.riskTag === 'illegal') reward *= 3;
    if (dest.id === 'port_abyss') reward *= 2;

    generated.push({
      id: `gen_contract_${Date.now()}_${i}`,
      name: `运送${cargo.name}至${dest.name}`,
      requiredCargoName: cargo.name,
      requiredAmount: amount,
      reward,
      penalty: Math.floor(reward * 0.3),
      requiredReputation: cargo.requiredReputation,
      destinationPortId: dest.id,
      destinationPortName: dest.name
    });
  }

  return generated;
}
