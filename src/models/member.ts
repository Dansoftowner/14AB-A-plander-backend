import mongoose, { Schema, Types } from 'mongoose'
import { Association } from './association'

export interface Member {
  isRegistered: boolean
  association: Association | Types.ObjectId
  email: string
  username: string
  password: string
  name: string
  address: string
  idNumber: string
  phoneNumber: string
  guardNumber: string
  roles: string[]
  preferences: object
}

const memberSchema = new Schema<Member>({
  isRegistered: {
    type: Boolean,
    required: true,
  },
  association: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Association',
    index: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
    validate: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
  },
  username: {
    type: String,
    index: true,
    required: function () {
      return this.isRegistered
    },
  },
  password: {
    type: String,
    required: function () {
      return this.isRegistered
    },
  },
  name: {
    type: String,
    minlength: 5,
    validate: (v) => {
      return (
        /^[^\d]+\s[^\d]+(\s[^\d]+)*$/g.test(v) &&
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(v)
      )
    },
  },
  address: {
    type: String,
    minlength: 5,
    validate: /[0-9]/,
  },
})

memberSchema.index({ association: 1, email: 1 }, { unique: true })
memberSchema.index({ association: 1, username: 1 }, { unique: true })
