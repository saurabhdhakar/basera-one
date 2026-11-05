(function(global){
  function escape(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function imageUrl(value){
    if(typeof value !== 'string') return '';
    if(/^\/[^/\\]/.test(value) && !/[\\\u0000-\u001f]/.test(value)) return value;
    try { var url = new URL(value); return url.protocol==='https:' && !url.username && !url.password ? url.href : ''; } catch(e){return '';}
  }
  var paths = {
    back:'<path d="M20 12H4.5M10.5 5.5 4 12l6.5 6.5"/>',
    share:'<path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/>',
    pin:'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r=".5"/>',
    ac:'<path d="M12 2v20M3.5 7l17 10M3.5 17l17-10M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M4 14l4 1-1 4M20 10l-4-1 1-4"/>',
    parking:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    power:'<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
    kitchen:'<path d="M4 3v6c0 3 6 3 6 0V3M7 3v18M19 21V3c-4 2-4 9 0 10"/>',
    bed:'<path d="M3 18V6m18 12V9H3m0 6h18M6 9V6h6v3m2 0V6h5v3"/>',
    check:'<path d="m9 12 2 2 4-4"/><path d="m12 2 3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1Z"/>',
    chat:'<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-6 3 2-6a9 9 0 1 1 17-5Z"/><path d="M8 10h8M8 14h5"/>',
    call:'<path d="m7 3 3 5-3 3c1 3 3 5 6 6l3-3 5 3c0 3-2 5-5 4C9 19 5 15 3 8c-1-3 1-5 4-5Z"/>',
    camera:'<path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/>'
  };
  function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.check)+'</svg>';}
  function model(listing){
    var values = Array.isArray(listing.amenities) ? listing.amenities.filter(function(v){return typeof v==='string';}) : [];
    var includes = function(pattern){ return values.some(function(v){return pattern.test(v);}); };
    var status = function(yes,no){return yes ? 'Available' : no ? 'Not available' : 'Not specified';};
    var parking = listing.parking || listing.parkingSpace || listing.carParking;
    var food = listing.foodAvailability || listing.food || listing.kitchen;
    var items = [
      {label:'Wi-Fi',icon:'wifi',status:status(includes(/wi.?fi/i)||listing.wifi===true,listing.wifi===false)},
      {label:'Air conditioning',icon:'ac',status:status(includes(/^ac$|air conditioning/i)||listing.ac===true||/^AC /.test(listing.acType||''),listing.ac===false||/^Non-AC/.test(listing.acType||''))},
      {label:'Parking',icon:'parking',status:status(includes(/parking/i)||Boolean(parking && !/^(no parking|not available|0)$/i.test(String(parking))),Boolean(parking && /^(no parking|not available|0)$/i.test(String(parking))))},
      {label:'Power backup',icon:'power',status:status(includes(/power backup/i)||listing.powerBackup===true,listing.powerBackup===false)},
      {label:'Kitchen / Food',icon:'kitchen',status:typeof food==='string' ? food : status(food===true||includes(/kitchen|food|mess|tiffin/i),food===false)}
    ];
    values.filter(function(v){return !/wi.?fi|^ac$|air conditioning|parking|power backup|kitchen|food|mess|tiffin/i.test(v);}).forEach(function(v){items.push({label:v,icon:/bed/i.test(v)?'bed':'check',status:'Available'});});
    var raw = listing.securityDeposit != null ? listing.securityDeposit : listing.deposit;
    var deposit = raw !== '' && raw != null && Number.isFinite(Number(raw)) && Number(raw)>=0 ? Number(raw) : null;
    return {photos:(Array.isArray(listing.photos)?listing.photos:[]).map(imageUrl).filter(Boolean),deposit:deposit,avatar:imageUrl(listing.ownerPhotoURL||listing.ownerAvatar||listing.ownerPhoto),verified:listing.verified===true,amenities:items};
  }
  global.BaseraPropertyDetails={escape:escape,icon:icon,model:model};
})(window);
