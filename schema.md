# Schema Reference

## Customer
id, name, email, phone, notes, createdAt, updatedAt

## Job
id, customerId, status, source, jobStart, jobEnd, notes, createdById, createdAt, updatedAt

## JobItem
id, jobId, productId, unitPrice, notes

## JobItemCustomisation
id, jobItemId, customisationOptionId, value, notes

## JobItemDate
id, jobId, jobItemId, productId, date

## Delivery
id, jobId, outboundMethod, returnMethod, venueName, venueAddress, venueEircode, venueCounty, lat, lng, notes, outboundAt, returnAt

## Pricing
id, jobId, rentalCost, deliveryCost, totalCost, deliveryZoneId, createdAt, updatedAt

## Quote
id, jobId, pdfUrl, sentAt, createdAt, updatedAt

## Invoice
id, jobId, reference, status, dueDate, pdfUrl, sentAt, createdAt, updatedAt

## User
id, email, passwordHash, displayName, role, isActive, createdAt, updatedAt

## Product
id, name, slug, description, stockQuantity, isCustomisable, customisationOverview, isActive, displayOrder, createdAt, updatedAt

## ProductImage
id, productId, url, altText, displayOrder, isPrimary, createdAt

## ProductCustomisationOption
id, productId, name, description, type, options, basePrice, isRequired, displayOrder, isActive

## CompanySettings
id, companyName, tagline, logoLightSmallUrl, logoLightLargeUrl, logoDarkSmallUrl, logoDarkLargeUrl, contactEmail, contactPhone, contactAddress, socialLinks, metaTitle, metaDescription, deliveryInfoText, businessLat, businessLng, updatedAt, updatedById

## DeliveryZone
id, name, description, zoneType, price, isEnquireOnly, displayOrder, isActive, centerLat, centerLng, radiusKm

## EmailTemplate
id, name, triggerEvent, subject, description, isActive

## AuditLog
id, userId, action, entityType, entityId, metadata, createdAt

## ApiUsageLog
id, apiName, triggeredBy, userId, createdAt
