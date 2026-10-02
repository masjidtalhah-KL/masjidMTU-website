/** Every public boundary explicitly excludes both drafts and release versions. */
const published = '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';
const image = 'alt, "asset": asset->{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height}';
const media = `_key, caption, image{${image}}`;

export const publicQueries = {
  profile: `*[_type == "profilePage" && _id == "profilePage" && ${published}][0]{
    _id, introduction, sourceNote, vision, mission, motto, logoRationale, spaceImages[]{${media}}
  }`,
  organisation: `*[_type == "organisationMember" && ${published} && isActive == true]
    | order(group asc, displayOrder asc, _id asc){
      _id, role, group, isVacant, name, employmentTitle, displayOrder, isActive, photo{${image}}
    }`,
  surau: `*[_type == "surau" && ${published} && isActive == true]
    | order(category asc, displayOrder asc, _id asc){
      _id, name, category, address, displayOrder, isActive, logo{${image}}
    }`,
  gallery: `*[_type == "galleryCollection" && _id == "galleryCollection-interior-masjid" && ${published}][0]{
    _id, title, category, items[]{${media}}
  }`,
  settings: `*[_type == "siteSettings" && _id == "siteSettings" && ${published}][0]{
    _id, mosqueName, address, phone, email, facebookUrl, instagramUrl, officeHours[]{days, hours}
  }`,
} as const;
