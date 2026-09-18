import type { RecoveryOption, Shipment } from "@/types";

export type RecoveryEvaluation = {
  hasCapacity: boolean;
  arrivesBeforeDeadline: boolean;
  compatible: boolean;
};

export function evaluateRecoveryOption(
  shipment: Shipment,
  option: RecoveryOption,
): RecoveryEvaluation {
  const hasCapacity = option.availableCapacity >= shipment.weight;
  const arrivesBeforeDeadline =
    Date.parse(option.estimatedArrival) <= Date.parse(shipment.deadline);

  return {
    hasCapacity,
    arrivesBeforeDeadline,
    compatible: hasCapacity && arrivesBeforeDeadline,
  };
}
