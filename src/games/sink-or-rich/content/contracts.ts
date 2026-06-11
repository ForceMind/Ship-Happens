import { Cargo, Contract, Port } from '../types';

export function createContractKey(contract: Pick<Contract, 'destinationPortId' | 'requiredCargoName' | 'requiredAmount'>): string {
  return `${contract.destinationPortId || ''}:${contract.requiredCargoName}:${contract.requiredAmount}`;
}

const CARGO_RISK_REWARD_MULTIPLIER: Record<Cargo['riskTag'], number> = {
  low: 1.1,
  medium: 1.35,
  high: 1.7,
  extreme: 2.2,
  illegal: 2.6,
};

const PORT_DISTANCE_PREMIUM: Record<string, number> = {
  port_royal: 1.0,
  port_tortuga: 1.15,
  port_nassau: 1.1,
  port_cartagena: 1.25,
  port_oriental: 1.65,
  port_azores: 1.45,
  port_madagascar: 1.85,
};

export function calculateContractReward(currentPort: Port, destinationPort: Port, cargo: Cargo, amount: number): number {
  const sourceBuyPrice = cargo.buyPrice * (currentPort.priceMultipliers[cargo.id] || 1);
  const destinationSellPrice = cargo.sellPrice * (destinationPort.priceMultipliers[cargo.id] || 1);
  const priceSpread = Math.max(40, destinationSellPrice - sourceBuyPrice);
  const demandPremium = Math.max(0.9, destinationSellPrice / Math.max(1, cargo.sellPrice));
  const distancePremium = PORT_DISTANCE_PREMIUM[destinationPort.id] || 1.2;
  const riskMultiplier = CARGO_RISK_REWARD_MULTIPLIER[cargo.riskTag];

  return Math.floor((priceSpread * riskMultiplier + destinationSellPrice * 0.35) * demandPremium * distancePremium * amount);
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
    const reward = calculateContractReward(currentPort, dest, cargo, amount);

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
