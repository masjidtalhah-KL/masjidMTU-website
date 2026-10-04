const published =
  '!(_id in path("drafts.**")) && !(_id in path("versions.**"))';
export const lectureIndexQuery = `*[_type == "lectureMonth" && ${published}] | order(year desc, month desc){_id,_type,year,month}`;
export const lectureMonthQuery = `{
  "document": *[_type == "lectureMonth" && _id == $id && ${published}][0],
  "portraits": *[_type == "lectureMonth" && _id == $id && ${published}][0].entries[].sessions[].photo.asset->{_id,_type},
  "posters": *[_type == "lectureMonth" && _id == $id && ${published}][0].entries[].specialPoster.image.asset->{_id,_type},
  "compactQr": *[_id == "siteSettings" && ${published}][0].donationInfo.compactQr,
  "compactAsset": *[_id == "siteSettings" && ${published}][0].donationInfo.compactQr.asset->{_id,_type}
}`;
