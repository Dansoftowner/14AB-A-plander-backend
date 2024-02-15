export class ChatMessageDto {
  _id!: string
  sender!: { _id: string; name: string }
  association!: string
  timestamp!: Date
  content!: string
}
