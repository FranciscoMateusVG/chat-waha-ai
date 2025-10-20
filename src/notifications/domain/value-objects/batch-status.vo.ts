export enum BatchStatusType {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class BatchStatus {
  private readonly _value: BatchStatusType;
  private readonly _errorMessage?: string;

  constructor(value: BatchStatusType | string, errorMessage?: string) {
    if (typeof value === 'string') {
      if (!Object.values(BatchStatusType).includes(value as BatchStatusType)) {
        throw new Error(`Invalid batch status: ${value}`);
      }
      this._value = value as BatchStatusType;
    } else {
      this._value = value;
    }

    if (this._value === BatchStatusType.FAILED && !errorMessage) {
      throw new Error('Error message is required for failed status');
    }
    
    this._errorMessage = errorMessage;
  }

  get value(): BatchStatusType {
    return this._value;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  isPending(): boolean {
    return this._value === BatchStatusType.PENDING;
  }

  isProcessing(): boolean {
    return this._value === BatchStatusType.PROCESSING;
  }

  isCompleted(): boolean {
    return this._value === BatchStatusType.COMPLETED;
  }

  isFailed(): boolean {
    return this._value === BatchStatusType.FAILED;
  }

  canTransitionTo(newStatus: BatchStatus): boolean {
    const transitions: Record<BatchStatusType, BatchStatusType[]> = {
      [BatchStatusType.PENDING]: [
        BatchStatusType.PROCESSING,
        BatchStatusType.FAILED,
      ],
      [BatchStatusType.PROCESSING]: [
        BatchStatusType.COMPLETED,
        BatchStatusType.FAILED,
      ],
      [BatchStatusType.COMPLETED]: [],
      [BatchStatusType.FAILED]: [],
    };

    return transitions[this._value].includes(newStatus._value);
  }

  equals(other: BatchStatus): boolean {
    return this._value === other._value && this._errorMessage === other._errorMessage;
  }

  toString(): string {
    return this._value;
  }

  static pending(): BatchStatus {
    return new BatchStatus(BatchStatusType.PENDING);
  }

  static processing(): BatchStatus {
    return new BatchStatus(BatchStatusType.PROCESSING);
  }

  static completed(): BatchStatus {
    return new BatchStatus(BatchStatusType.COMPLETED);
  }

  static failed(errorMessage: string): BatchStatus {
    return new BatchStatus(BatchStatusType.FAILED, errorMessage);
  }
}