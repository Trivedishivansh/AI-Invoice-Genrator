import mongoose from "mongoose";

const businessProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    gst: {
      type: String,
      default: "",
    },

    logoUrl: {
      type: String,
      default: null,
    },

    stampUrl: {
      type: String,
      default: null,
    },

    signatureUrl: {
      type: String,
      default: null,
    },

    signatureOwnerName: {
      type: String,
      default: "",
    },

    signatureOwnerTitle: {
      type: String,
      default: "",
    },

    defaultTaxPercent: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const BusinessProfile =
  mongoose.models.BusinessProfile ||
  mongoose.model("BusinessProfile", businessProfileSchema);

export default BusinessProfile;
