export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  active: boolean;
  occurredAt: string;
}

export interface UserUpdatedEvent {
  userId: string;
  email: string;
  name: string;
  active: boolean;
  occurredAt: string;
}

export interface UserDeletedEvent {
  userId: string;
  occurredAt: string;
}
