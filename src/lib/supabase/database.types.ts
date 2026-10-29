
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "animal_health": {
                  Row: {
                    "animal_id": string,"created_at": string,"notes": string | null,"sterilized": boolean,"updated_at": string,"vaccinated": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"notes"?: string | null,"sterilized"?: boolean,"updated_at"?: string,"vaccinated"?: boolean
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"notes"?: string | null,"sterilized"?: boolean,"updated_at"?: string,"vaccinated"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_health_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: true
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "animal_health_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: true
      referencedRelation: "public_listings"
      referencedColumns: ["animal_id"]
    }
                  ]
                },"animal_private": {
                  Row: {
                    "animal_id": string,"created_at": string,"microchip_number": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"microchip_number"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"microchip_number"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_private_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: true
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "animal_private_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: true
      referencedRelation: "public_listings"
      referencedColumns: ["animal_id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "id": string,"listing_id": string,"profile_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"listing_id": string,"profile_id": string,"created_at"?: string
                  }
                  Update: {
                    "id"?: string,"listing_id"?: string,"profile_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
                      foreignKeyName: "favorites_listing_id_fkey"
                      columns: ["listing_id"]
                      isOneToOne: false
                      referencedRelation: "listings"
                      referencedColumns: ["id"]
                    },
                    {
                      foreignKeyName: "favorites_profile_id_fkey"
                      columns: ["profile_id"]
                      isOneToOne: false
                      referencedRelation: "profiles"
                      referencedColumns: ["id"]
                    }
                  ]
                },"reports": {
                  Row: {
                    "id": string,"reporter_id": string | null,"listing_id": string,"reason": Database["public"]["Enums"]["report_reason"],"details": string | null,"status": Database["public"]["Enums"]["report_status"],"handled_by": string | null,"handled_at": string | null,"resolution_notes": string | null,"created_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"reporter_id"?: string | null,"listing_id": string,"reason": Database["public"]["Enums"]["report_reason"],"details"?: string | null,"status"?: Database["public"]["Enums"]["report_status"],"handled_by"?: string | null,"handled_at"?: string | null,"resolution_notes"?: string | null,"created_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "id"?: string,"reporter_id"?: string | null,"listing_id"?: string,"reason"?: Database["public"]["Enums"]["report_reason"],"details"?: string | null,"status"?: Database["public"]["Enums"]["report_status"],"handled_by"?: string | null,"handled_at"?: string | null,"resolution_notes"?: string | null,"created_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
                      foreignKeyName: "reports_listing_id_fkey"
                      columns: ["listing_id"]
                      isOneToOne: false
                      referencedRelation: "listings"
                      referencedColumns: ["id"]
                    },
                    {
                      foreignKeyName: "reports_reporter_id_fkey"
                      columns: ["reporter_id"]
                      isOneToOne: false
                      referencedRelation: "profiles"
                      referencedColumns: ["id"]
                    },
                    {
                      foreignKeyName: "reports_handled_by_fkey"
                      columns: ["handled_by"]
                      isOneToOne: false
                      referencedRelation: "profiles"
                      referencedColumns: ["id"]
                    }
                  ]
                },"animals": {
                  Row: {
                    "apartment_ok": boolean | null,"birth_date": string,"breed": string | null,"city": string,"created_at": string,"good_with_cats": boolean | null,"good_with_dogs": boolean | null,"good_with_kids": boolean | null,"id": string,"location": unknown,"name": string,"organization_id": string | null,"origin": Database["public"]['Enums']["animal_origin"] | null,"profile_id": string | null,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"species": Database["public"]['Enums']["species"],"status": Database["public"]['Enums']["animal_status"],"story": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apartment_ok"?: boolean | null,"birth_date": string,"breed"?: string | null,"city": string,"created_at"?: string,"good_with_cats"?: boolean | null,"good_with_dogs"?: boolean | null,"good_with_kids"?: boolean | null,"id"?: string,"location"?: unknown,"name": string,"organization_id"?: string | null,"origin"?: Database["public"]['Enums']["animal_origin"] | null,"profile_id"?: string | null,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"species": Database["public"]['Enums']["species"],"status"?: Database["public"]['Enums']["animal_status"],"story"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "apartment_ok"?: boolean | null,"birth_date"?: string,"breed"?: string | null,"city"?: string,"created_at"?: string,"good_with_cats"?: boolean | null,"good_with_dogs"?: boolean | null,"good_with_kids"?: boolean | null,"id"?: string,"location"?: unknown,"name"?: string,"organization_id"?: string | null,"origin"?: Database["public"]['Enums']["animal_origin"] | null,"profile_id"?: string | null,"sex"?: Database["public"]['Enums']["animal_sex"],"size"?: Database["public"]['Enums']["animal_size"],"species"?: Database["public"]['Enums']["species"],"status"?: Database["public"]['Enums']["animal_status"],"story"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "animals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "animals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "animals_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"inquiries": {
                  Row: {
                    "created_at": string,"from_last_read_at": string | null,"from_profile_id": string,"id": string,"last_message_at": string,"last_message_sender_id": string | null,"listing_id": string,"owner_last_read_at": string | null,"status": Database["public"]['Enums']["inquiry_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_last_read_at"?: string | null,"from_profile_id": string,"id"?: string,"last_message_at"?: string,"last_message_sender_id"?: string | null,"listing_id": string,"owner_last_read_at"?: string | null,"status"?: Database["public"]['Enums']["inquiry_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"from_last_read_at"?: string | null,"from_profile_id"?: string,"id"?: string,"last_message_at"?: string,"last_message_sender_id"?: string | null,"listing_id"?: string,"owner_last_read_at"?: string | null,"status"?: Database["public"]['Enums']["inquiry_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inquiries_from_profile_id_fkey"
      columns: ["from_profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inquiries_last_message_sender_id_fkey"
      columns: ["last_message_sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inquiries_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inquiries_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["listing_id"]
    }
                  ]
                },"inquiry_messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"inquiry_id": string,"sender_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"inquiry_id": string,"sender_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"inquiry_id"?: string,"sender_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inquiry_messages_inquiry_id_fkey"
      columns: ["inquiry_id"]
isOneToOne: false
      referencedRelation: "inquiries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inquiry_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"italian_cities": {
                  Row: {
                    "istat_code": string,"lat": number,"lng": number,"name": string,"province": string,"province_code": string,"region": string,"slug": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "istat_code": string,"lat": number,"lng": number,"name": string,"province": string,"province_code": string,"region": string,"slug"?: never
                  }
                  Update: {
                    "istat_code"?: string,"lat"?: number,"lng"?: number,"name"?: string,"province"?: string,"province_code"?: string,"region"?: string,"slug"?: never
                  }
                  Relationships: [
                    
                  ]
                },"listing_photos": {
                  Row: {
                    "alt_text": string,"created_at": string,"id": string,"listing_id": string,"position": number,"storage_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text": string,"created_at"?: string,"id"?: string,"listing_id": string,"position"?: number,"storage_path": string,"updated_at"?: string
                  }
                  Update: {
                    "alt_text"?: string,"created_at"?: string,"id"?: string,"listing_id"?: string,"position"?: number,"storage_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_photos_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listing_photos_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["listing_id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "animal_id": string,"created_at": string,"expires_at": string | null,"id": string,"published_at": string | null,"slug": string | null,"status": Database["public"]['Enums']["listing_status"],"type": Database["public"]['Enums']["listing_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "animal_id": string,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"published_at"?: string | null,"slug"?: string | null,"status"?: Database["public"]['Enums']["listing_status"],"type": Database["public"]['Enums']["listing_type"],"updated_at"?: string
                  }
                  Update: {
                    "animal_id"?: string,"created_at"?: string,"expires_at"?: string | null,"id"?: string,"published_at"?: string | null,"slug"?: string | null,"status"?: Database["public"]['Enums']["listing_status"],"type"?: Database["public"]['Enums']["listing_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "animals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_animal_id_fkey"
      columns: ["animal_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["animal_id"]
    }
                  ]
                },"moderation_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": string,"reason": string | null,"target_id": string,"target_type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"reason"?: string | null,"target_id": string,"target_type": string,"updated_at"?: string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: string,"reason"?: string | null,"target_id"?: string,"target_type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_documents": {
                  Row: {
                    "created_at": string,"doc_type": Database["public"]['Enums']["org_document_type"],"id": string,"mime_type": string,"organization_id": string,"original_name": string,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"size_bytes": number,"status": Database["public"]['Enums']["document_status"],"storage_path": string,"updated_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"doc_type": Database["public"]['Enums']["org_document_type"],"id"?: string,"mime_type": string,"organization_id": string,"original_name": string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"size_bytes": number,"status"?: Database["public"]['Enums']["document_status"],"storage_path": string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"doc_type"?: Database["public"]['Enums']["org_document_type"],"id"?: string,"mime_type"?: string,"organization_id"?: string,"original_name"?: string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"size_bytes"?: number,"status"?: Database["public"]['Enums']["document_status"],"storage_path"?: string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_documents_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_documents_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "organization_documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string,"id": string,"member_role": Database["public"]['Enums']["org_member_role"],"organization_id": string,"profile_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"member_role"?: Database["public"]['Enums']["org_member_role"],"organization_id": string,"profile_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"member_role"?: Database["public"]['Enums']["org_member_role"],"organization_id"?: string,"profile_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "public_listings"
      referencedColumns: ["organization_id"]
    },{
      foreignKeyName: "organization_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_private": {
                  Row: {
                    "contact_email": string | null,"contact_phone": string | null,"created_at": string,"legal_name": string | null,"organization_id": string,"registration_number": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"legal_name"?: string | null,"organization_id": string,"registration_number"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"legal_name"?: string | null,"organization_id"?: string,"registration_number"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_private_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_private_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: true
      referencedRelation: "public_listings"
      referencedColumns: ["organization_id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "city": string,"created_at": string,"description": string | null,"id": string,"name": string,"region": string,"slug": string,"type": Database["public"]['Enums']["organization_type"],"updated_at": string,"verification_status": Database["public"]['Enums']["verification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"region": string,"slug": string,"type": Database["public"]['Enums']["organization_type"],"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Update: {
                    "city"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"region"?: string,"slug"?: string,"type"?: Database["public"]['Enums']["organization_type"],"updated_at"?: string,"verification_status"?: Database["public"]['Enums']["verification_status"]
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "city": string | null,"created_at": string,"display_name": string | null,"id": string,"notification_prefs": NonNullable<Json>,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"notification_prefs"?: NonNullable<Json>,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "city"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"notification_prefs"?: NonNullable<Json>,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_listings": {
                  Row: {
                    "animal_id": string,"apartment_ok": boolean | null,"birth_date": string,"breed": string | null,"city": string,"cover_photo_alt": string | null,"cover_photo_id": string | null,"expires_at": string | null,"good_with_cats": boolean | null,"good_with_dogs": boolean | null,"good_with_kids": boolean | null,"health_notes": string | null,"listing_id": string,"listing_status": Database["public"]['Enums']["listing_status"],"listing_type": Database["public"]['Enums']["listing_type"],"location": unknown,"name": string,"organization_id": string | null,"organization_name": string | null,"organization_slug": string | null,"origin": Database["public"]['Enums']["animal_origin"] | null,"published_at": string | null,"search_vector": unknown,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"slug": string | null,"species": Database["public"]['Enums']["species"],"sterilized": boolean | null,"story": string | null,"vaccinated": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "_add_inquiry_message":
{ Args: { "p_body": string,"p_inquiry_id": string,"p_sender": string }; Returns: string
                           },
"admin_set_organization_verification":
{ Args: { "p_org_id": string,"p_reason"?: string,"p_status": Database["public"]['Enums']["verification_status"] }; Returns: undefined
                           },
"can_manage_animal":
{ Args: { "target_animal_id": string }; Returns: boolean
                           },
"can_manage_listing":
{ Args: { "target_listing_id": string }; Returns: boolean
                           },
"city_point":
{ Args: { "p_city": string,"p_region"?: string }; Returns: unknown
                           },
"compliance_rules":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"create_inquiry":
{ Args: { "p_listing_id": string,"p_message": string }; Returns: string
                           },
"create_organization":
{ Args: { "p_city": string,"p_contact_email": string,"p_contact_phone": string,"p_description": string,"p_legal_name": string,"p_name": string,"p_region": string,"p_registration_number": string,"p_type": Database["public"]['Enums']["organization_type"] }; Returns: string
                           },
"expire_listings":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"extend_listing":
{ Args: { "p_listing_id": string }; Returns: undefined
                           },
"inquiry_notification_targets":
{ Args: { "p_author": string,"p_inquiry_id": string }; Returns: {
              "display_name": string,"email": string
            }[]
                           },
"inquiry_view":
{ Args: { "p_inquiry_id"?: string }; Returns: {
              "animal_name": string,"counterpart": string,"inquiry_id": string,"last_message_at": string,"listing_id": string,"listing_slug": string,"listing_status": Database["public"]['Enums']["listing_status"],"role": string,"status": Database["public"]['Enums']["inquiry_status"],"unread": boolean
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_org_member":
{ Args: { "org_id": string }; Returns: boolean
                           },
"is_org_owner":
{ Args: { "org_id": string }; Returns: boolean
                           },
"listing_compliance_issues":
{ Args: { "p_listing_id": string }; Returns: (string)[]
                           },
"mark_inquiry_read":
{ Args: { "p_inquiry_id": string }; Returns: undefined
                           },
"post_inquiry_message":
{ Args: { "p_body": string,"p_inquiry_id": string }; Returns: string
                           },
"publish_listing":
{ Args: { "p_listing_id": string }; Returns: undefined
                           },
"request_organization_review":
{ Args: { "p_org_id": string }; Returns: undefined
                           },
"search_listings":
{ Args: { "p_apartment"?: boolean,"p_cats"?: boolean,"p_city_slug"?: string,"p_dogs"?: boolean,"p_kids"?: boolean,"p_lat"?: number,"p_limit"?: number,"p_lng"?: number,"p_offset"?: number,"p_query"?: string,"p_radius_km"?: number,"p_sex"?: Database["public"]['Enums']["animal_sex"],"p_size"?: Database["public"]['Enums']["animal_size"],"p_species"?: Database["public"]['Enums']["species"] }; Returns: {
              "birth_date": string,"breed": string,"city": string,"cover_photo_alt": string,"cover_photo_id": string,"distance_km": number,"listing_id": string,"listing_status": Database["public"]['Enums']["listing_status"],"listing_type": Database["public"]['Enums']["listing_type"],"name": string,"organization_name": string,"organization_slug": string,"published_at": string,"sex": Database["public"]['Enums']["animal_sex"],"size": Database["public"]['Enums']["animal_size"],"slug": string,"species": Database["public"]['Enums']["species"],"total_count": number
            }[]
                           },
"set_inquiry_status":
{ Args: { "p_inquiry_id": string,"p_status": Database["public"]['Enums']["inquiry_status"] }; Returns: undefined
                           },
"slugify":
{ Args: { "input": string }; Returns: string
                           },
"storage_listing_id":
{ Args: { "object_name": string }; Returns: string
                           },
"storage_org_id":
{ Args: { "object_name": string }; Returns: string
                           },
"admin_resolve_report":
{ Args: { "report_id": string, "new_status": Database["public"]["Enums"]["report_status"], "takedown_listing": boolean, "notes": string }; Returns: undefined
                           },
"export_user_data":
{ Args: { "user_id": string }; Returns: Json
                           },
"switch_to_private_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           }
          }
          Enums: {
            "animal_origin": "stray_rescued"|"surrendered_by_owner"|"family_pet"|"home_litter","animal_sex": "M"|"F","animal_size": "small"|"medium"|"large","animal_status": "active"|"archived","document_status": "pending"|"accepted"|"rejected","inquiry_status": "open"|"closed"|"blocked","listing_status": "draft"|"pending_review"|"published"|"reserved"|"adopted"|"expired"|"removed","listing_type": "adoption"|"gift","org_document_type": "registration"|"statute"|"other","org_member_role": "owner"|"member","organization_type": "shelter"|"association"|"breeder","species": "dog"|"cat","user_role": "adopter"|"shelter_member"|"private"|"admin","report_reason": "suspected_scam"|"commercial_sale_prohibited"|"underage_animal"|"illegal_import_or_no_microchip"|"animal_welfare_concern"|"inappropriate_content"|"other","report_status": "pending"|"investigating"|"resolved_takedown"|"dismissed","verification_status": "pending"|"verified"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "animal_origin": ["stray_rescued", "surrendered_by_owner", "family_pet", "home_litter"],"animal_sex": ["M", "F"],"animal_size": ["small", "medium", "large"],"animal_status": ["active", "archived"],"document_status": ["pending", "accepted", "rejected"],"inquiry_status": ["open", "closed", "blocked"],"listing_status": ["draft", "pending_review", "published", "reserved", "adopted", "expired", "removed"],"listing_type": ["adoption", "gift"],"org_document_type": ["registration", "statute", "other"],"org_member_role": ["owner", "member"],"organization_type": ["shelter", "association", "breeder"],"species": ["dog", "cat"],"user_role": ["adopter", "shelter_member", "private", "admin"],"verification_status": ["pending", "verified", "rejected"]
          }
        }
} as const
