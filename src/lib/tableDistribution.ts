interface Guest {
  id: string;
  name: string;
  table_number: number | null;
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
}

interface Distribution {
  guestId: string;
  tableNumber: number;
}

interface TableOccupancy {
  tableNumber: number;
  capacity: number;
  occupied: number;
  available: number;
  status: "empty" | "partial" | "full" | "overfull";
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

export function autoDistributeGuests(
  guests: Guest[],
  tables: Table[]
): Distribution[] {
  const distributions: Distribution[] = [];
  const unassignedGuests = guests.filter(g => g.table_number === null);
  const sortedTables = [...tables].sort((a, b) => a.table_number - b.table_number);
  
  let currentTableIndex = 0;
  let currentTableCount = 0;

  for (const guest of unassignedGuests) {
    if (currentTableIndex >= sortedTables.length) {
      // No more tables available
      break;
    }

    const currentTable = sortedTables[currentTableIndex];
    
    distributions.push({
      guestId: guest.id,
      tableNumber: currentTable.table_number,
    });

    currentTableCount++;

    // Move to next table if current is full
    if (currentTableCount >= currentTable.capacity) {
      currentTableIndex++;
      currentTableCount = 0;
    }
  }

  return distributions;
}

export function redistributeGuests(
  allGuests: Guest[],
  tables: Table[]
): Distribution[] {
  // Clear all assignments and redistribute
  const guestsWithoutTables = allGuests.map(g => ({ ...g, table_number: null }));
  return autoDistributeGuests(guestsWithoutTables, tables);
}

export function getTableOccupancy(
  tableNumber: number,
  guests: Guest[],
  tables: Table[]
): TableOccupancy {
  const table = tables.find(t => t.table_number === tableNumber);
  if (!table) {
    return {
      tableNumber,
      capacity: 0,
      occupied: 0,
      available: 0,
      status: "empty",
    };
  }

  const occupied = guests.filter(g => g.table_number === tableNumber).length;
  const available = table.capacity - occupied;

  let status: TableOccupancy["status"];
  if (occupied === 0) {
    status = "empty";
  } else if (occupied < table.capacity) {
    status = "partial";
  } else if (occupied === table.capacity) {
    status = "full";
  } else {
    status = "overfull";
  }

  return {
    tableNumber,
    capacity: table.capacity,
    occupied,
    available,
    status,
  };
}

export function validateTableAssignment(
  guestId: string,
  tableNumber: number,
  guests: Guest[],
  tables: Table[]
): ValidationResult {
  const table = tables.find(t => t.table_number === tableNumber);
  
  if (!table) {
    return {
      valid: false,
      message: `Mesa ${tableNumber} não existe.`,
    };
  }

  const occupancy = getTableOccupancy(tableNumber, guests, tables);
  const currentGuest = guests.find(g => g.id === guestId);
  
  // If guest is already at this table, it's valid
  if (currentGuest?.table_number === tableNumber) {
    return { valid: true, message: "Convidado já está nesta mesa." };
  }

  // Check if table has space (considering the guest will be added)
  if (occupancy.occupied >= table.capacity) {
    return {
      valid: false,
      message: `Mesa ${tableNumber} está cheia (${occupancy.occupied}/${table.capacity}).`,
    };
  }

  return {
    valid: true,
    message: "Mesa disponível.",
  };
}

export function getUnassignedGuestsCount(guests: Guest[]): number {
  return guests.filter(g => g.table_number === null).length;
}

export function canAccommodateAllGuests(guests: Guest[], tables: Table[]): boolean {
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  return guests.length <= totalCapacity;
}

export function suggestAdditionalTables(
  guests: Guest[],
  tables: Table[],
  defaultCapacity: number = 8
): number {
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const shortfall = guests.length - totalCapacity;
  
  if (shortfall <= 0) return 0;
  
  return Math.ceil(shortfall / defaultCapacity);
}
