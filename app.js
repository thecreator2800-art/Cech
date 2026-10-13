const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>`<span class="ui-icon icon-${name}" aria-hidden="true"></span>`;
const staticPreview=Boolean(window.STATIC_PREVIEW);
function staticHref(path){if(!staticPreview)return path;if(path==='/')return './';if(path==='/tours')return './catalog.html';if(path==='/privacy')return './privacy.html';if(path==='/admin')return './';if(path.startsWith('/tour/'))return `./tour.html?slug=${encodeURIComponent(decodeURIComponent(path.slice(6)))}`;if(path.startsWith('/#'))return `./${path.slice(1)}`;return `.${path}`}
function rewriteStaticLinks(){if(!staticPreview)return;$$('a[href^="/"]').forEach(link=>link.setAttribute('href',staticHref(link.getAttribute('href'))))}
function upgradeStaticIcons(){
  const set=(selector,name)=>$$(selector).forEach(element=>{element.innerHTML=icon(name)});
  ['mountain','users-round','compass'].forEach((name,index)=>{const element=$$('.hero-features i')[index];if(element)element.innerHTML=icon(name)});
  [['.tours-section .aside-symbol','compass'],['.trust-section .aside-symbol','shield-check'],['.journey-section .aside-symbol','compass'],['.guides-section .aside-symbol','users-round'],['.reviews-section .aside-symbol','camera']].forEach(([selector,name])=>set(selector,name));
  ['user-round-check','shield-check','map-pinned','backpack','users-round','leaf'].forEach((name,index)=>{const element=$$('.trust-item .round-icon')[index];if(element)element.innerHTML=icon(name)});
  ['map-pinned','message-circle','clipboard-list','car-front','mountain','sparkles'].forEach((name,index)=>{const element=$$('.journey-steps .step-dot')[index];if(element)element.innerHTML=icon(name)});
  set('.placeholder-mark','image-plus');set('.faq-list summary span','plus');set('.desktop-nav .chevron','chevron-down');
  $$('.messengers').forEach(group=>['telegram','max','vk'].forEach((name,index)=>{const link=$$('a',group)[index];if(link)link.innerHTML=icon(name)}));
  $$('.header-phone').forEach(element=>element.insertAdjacentHTML('afterbegin',icon('phone')));
}
upgradeStaticIcons();
const menuButton=$('.menu-toggle');const mobileNav=$('.mobile-nav');
const menuBackdrop=$('.mobile-menu-backdrop');let menuCloseTimer;
function setMobileMenu(open){if(!menuButton||!mobileNav||!menuBackdrop)return;clearTimeout(menuCloseTimer);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');document.body.classList.toggle('mobile-menu-open',open);if(open){mobileNav.hidden=false;menuBackdrop.hidden=false;requestAnimationFrame(()=>{mobileNav.classList.add('is-open');menuBackdrop.classList.add('is-open')})}else{mobileNav.classList.remove('is-open');menuBackdrop.classList.remove('is-open');menuCloseTimer=setTimeout(()=>{mobileNav.hidden=true;menuBackdrop.hidden=true},340)}}
menuButton?.addEventListener('click',()=>setMobileMenu(menuButton.getAttribute('aria-expanded')!=='true'));
mobileNav?.querySelector('.mobile-nav-close')?.addEventListener('click',()=>{setMobileMenu(false);menuButton.focus()});
menuBackdrop?.addEventListener('click',()=>setMobileMenu(false));
mobileNav?.addEventListener('click',event=>{if(event.target.closest('a'))setMobileMenu(false)});
addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton?.getAttribute('aria-expanded')==='true'){setMobileMenu(false);menuButton.focus()}});
addEventListener('resize',()=>{if(innerWidth>1050&&menuButton?.getAttribute('aria-expanded')==='true')setMobileMenu(false)});
$('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));

let tours=[];let selectedRegion='all';let selectedDifficulty='all';
const catalogFilters=$('#catalog-filters');
const catalogState={from:'',to:'',min:'',max:'',sort:'date'};
function syncCatalogControls(){
  if(!catalogFilters)return;
  $('#catalog-region').value=selectedRegion;$('#catalog-difficulty').value=selectedDifficulty;$('#catalog-sort').value=catalogState.sort;
  [['#catalog-date-from','from'],['#catalog-date-to','to'],['#catalog-price-min','min'],['#catalog-price-max','max']].forEach(([selector,key])=>{$(selector).value=catalogState[key]});
  const shortDate=value=>new Date(value+'T00:00:00').toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
  const dates=catalogState.from&&catalogState.to?`${shortDate(catalogState.from)} — ${shortDate(catalogState.to)}`:catalogState.from?`С ${shortDate(catalogState.from)}`:catalogState.to?`До ${shortDate(catalogState.to)}`:'Любые даты';
  const number=value=>Number(value).toLocaleString('ru-RU');
  const price=catalogState.min&&catalogState.max?`${number(catalogState.min)}–${number(catalogState.max)} ₽`:catalogState.min?`От ${number(catalogState.min)} ₽`:catalogState.max?`До ${number(catalogState.max)} ₽`:'Любая стоимость';
  $('#catalog-dates-value').textContent=dates;$('#catalog-price-value').textContent=price;
  $('#catalog-dates-value').title=[catalogState.from,catalogState.to].filter(Boolean).join(' — ');$('#catalog-price-value').title=price;
  $$('[data-reset-catalog]',catalogFilters).forEach(button=>button.disabled=selectedRegion==='all'&&selectedDifficulty==='all'&&!catalogState.from&&!catalogState.to&&!catalogState.min&&!catalogState.max&&catalogState.sort==='date');
}
function validateCatalogFilters(){
  if(!catalogFilters)return true;
  const datesInvalid=Boolean(catalogState.from&&catalogState.to&&catalogState.from>catalogState.to);
  const priceNegative=[catalogState.min,catalogState.max].some(value=>value!==''&&Number(value)<0);
  const priceInvalid=Boolean(catalogState.min!==''&&catalogState.max!==''&&Number(catalogState.min)>Number(catalogState.max));
  const error=datesInvalid?'Дата «По» не должна быть раньше даты «С».':priceNegative?'Стоимость не может быть отрицательной.':priceInvalid?'Стоимость «До» не должна быть меньше стоимости «От».':'';
  const message=$('#catalog-filter-message');message.textContent=error;message.hidden=!error;
  ['#catalog-date-from','#catalog-date-to'].forEach(selector=>$(selector).setAttribute('aria-invalid',String(datesInvalid)));
  ['#catalog-price-min','#catalog-price-max'].forEach(selector=>$(selector).setAttribute('aria-invalid',String(priceNegative||priceInvalid)));
  return !error;
}
function updateCatalogUrl(){
  if(!catalogFilters)return;
  const url=new URL(location.href),values={region:selectedRegion==='all'?'':selectedRegion,difficulty:selectedDifficulty==='all'?'':selectedDifficulty,...catalogState,sort:catalogState.sort==='date'?'':catalogState.sort};
  Object.entries(values).forEach(([key,value])=>{if(value!=='')url.searchParams.set(key,value);else url.searchParams.delete(key)});history.replaceState(null,'',url);
}
function resetCatalogFilters(){
  selectedRegion='all';selectedDifficulty='all';Object.assign(catalogState,{from:'',to:'',min:'',max:'',sort:'date'});$$('.catalog-range').forEach(detail=>detail.open=false);renderTours();
}
function initializeCatalogFilters(){
  if(!catalogFilters)return;
  const regionSelect=$('#catalog-region'),regions=[...new Set(tours.map(tour=>tour.region).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  regionSelect.replaceChildren(new Option('Все направления','all'),...regions.map(region=>new Option(region,region)));
  const params=new URL(location.href).searchParams;
  selectedRegion=regions.includes(params.get('region'))?params.get('region'):'all';selectedDifficulty=['Лёгкий','Средний','Сложный'].includes(params.get('difficulty'))?params.get('difficulty'):'all';
  catalogState.sort=['date','price-asc','price-desc'].includes(params.get('sort'))?params.get('sort'):'date';
  [['#catalog-date-from','from'],['#catalog-date-to','to']].forEach(([selector,key])=>{const field=$(selector);field.value=params.get(key)||'';catalogState[key]=field.value});
  ['min','max'].forEach(key=>{const value=params.get(key);catalogState[key]=value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0?String(Number(value)):''});
  if(catalogState.from&&catalogState.to&&catalogState.from>catalogState.to){catalogState.from='';catalogState.to=''}
  if(catalogState.min!==''&&catalogState.max!==''&&Number(catalogState.min)>Number(catalogState.max)){catalogState.min='';catalogState.max=''}
  syncCatalogControls();
}
if(catalogFilters){
  const apply=()=>{selectedRegion=$('#catalog-region').value;selectedDifficulty=$('#catalog-difficulty').value;catalogState.sort=$('#catalog-sort').value;catalogState.from=$('#catalog-date-from').value;catalogState.to=$('#catalog-date-to').value;catalogState.min=$('#catalog-price-min').value;catalogState.max=$('#catalog-price-max').value;$$('[data-reset-catalog]',catalogFilters).forEach(button=>button.disabled=false);if(validateCatalogFilters())renderTours()};
  catalogFilters.addEventListener('input',apply);catalogFilters.addEventListener('submit',event=>{event.preventDefault();apply();if(validateCatalogFilters())$$('.catalog-range').forEach(detail=>detail.open=false)});
  catalogFilters.addEventListener('click',event=>{if(event.target.closest('[data-reset-catalog]'))resetCatalogFilters();const close=event.target.closest('[data-close-catalog-range]');if(close&&validateCatalogFilters()){const detail=close.closest('details');detail.open=false;detail.querySelector('summary').focus()}});
  $$('.catalog-range').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)$$('.catalog-range').forEach(other=>{if(other!==detail)other.open=false})}));
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.catalog-range'))$$('.catalog-range').forEach(detail=>detail.open=false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')$$('.catalog-range').forEach(detail=>detail.open=false)});
  $('#tour-grid').addEventListener('click',event=>{if(event.target.closest('[data-reset-catalog]'))resetCatalogFilters()});
}
const dateLabel=tour=>{if(!tour.startDate)return 'Дата уточняется';const start=new Date(tour.startDate+'T00:00:00');const end=tour.endDate?new Date(tour.endDate+'T00:00:00'):null;const fmt=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'});return end?`${fmt.format(start)} — ${fmt.format(end)}`:fmt.format(start)};
const money=value=>Number(value)>0?new Intl.NumberFormat('ru-RU').format(value)+' ₽':'Цена уточняется';
function tourCard(tour){return `<article class="tour-card"><div class="tour-card-media">${tour.image?`<img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.title)}">`:`<div class="media-placeholder"><span class="placeholder-mark">${icon('image-plus')}</span><strong>Фото маршрута</strong><small>Добавьте в управлении турами</small></div>`}<span class="region-tag">${icon('map-pin')}${escapeHtml(tour.region)}</span></div><div class="tour-card-body"><h3>${escapeHtml(tour.title)}</h3><div class="tour-meta"><span>${icon('calendar-days')}<b>${escapeHtml(dateLabel(tour))}</b></span><span>${icon('clock-3')}<b>${escapeHtml(tour.duration||'Уточняется')}</b></span><span class="tour-difficulty" data-difficulty="${escapeHtml(tour.difficulty||'')}">${icon('chart-no-axes-column-increasing')}<b>${escapeHtml(tour.difficulty||'Уточняется')}</b></span></div><div class="tour-card-footer"><div class="tour-price">${tour.price?`<small>от </small>${money(tour.price)}`:money(tour.price)}</div><a class="tour-arrow" href="/tour/${encodeURIComponent(tour.slug)}" aria-label="Подробнее: ${escapeHtml(tour.title)}">${icon('arrow-right')}</a></div></div></article>`}
function catalogTourCard(tour){
  const difficulty=escapeHtml(tour.difficulty||'Уточняется'),level=({'Лёгкий':1,'Средний':2,'Сложный':3})[tour.difficulty]||0;
  const dots=Array.from({length:3},(_,i)=>`<i class="${i<level?'is-filled':''}"></i>`).join('');
  return `<article class="tour-card catalog-tour-card"><div class="tour-card-media">${tour.image?`<img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.title)}" loading="lazy" decoding="async">`:`<div class="media-placeholder"><span class="placeholder-mark">${icon('image-plus')}</span><strong>Фото путешествия</strong><small>Место для фотографии маршрута</small></div>`}<span class="region-tag">${icon('map-pin')}${escapeHtml(tour.region)}</span></div><div class="tour-card-body"><h3>${escapeHtml(tour.title)}</h3><div class="catalog-tour-meta"><span>${icon('calendar-days')}${escapeHtml(dateLabel(tour))}</span><span>${icon('clock-3')}${escapeHtml(tour.duration||'Уточняется')}</span></div><span class="catalog-difficulty" data-difficulty="${difficulty}"><span class="difficulty-dots" aria-hidden="true">${dots}</span>${difficulty}</span><div class="tour-card-footer"><div class="tour-price">${tour.price?'<small>от </small>':''}${money(tour.price)}</div><a class="button button-gold catalog-tour-link" href="/tour/${encodeURIComponent(tour.slug)}" aria-label="Подробнее: ${escapeHtml(tour.title)}">Подробнее${icon('arrow-right').replace('ui-icon','ui-icon button-arrow')}</a></div></div></article>`;
}
function renderTours(){
  const grid=$('#tour-grid');if(!grid)return;
  if(catalogFilters&&!validateCatalogFilters())return;
  const filtered=tours.filter(tour=>{
    if(selectedRegion!=='all'&&tour.region!==selectedRegion||selectedDifficulty!=='all'&&tour.difficulty!==selectedDifficulty)return false;
    if(!catalogFilters)return true;
    const start=tour.startDate||tour.endDate,end=tour.endDate||tour.startDate;
    if((catalogState.from||catalogState.to)&&(!start||!end))return false;
    if(catalogState.from&&end<catalogState.from||catalogState.to&&start>catalogState.to)return false;
    const price=Number(tour.price);
    if((catalogState.min!==''||catalogState.max!=='')&&!(price>0))return false;
    if(catalogState.min!==''&&price<Number(catalogState.min)||catalogState.max!==''&&price>Number(catalogState.max))return false;
    return true;
  });
  const byDate=(a,b)=>(a.startDate||'9999').localeCompare(b.startDate||'9999');
  if(catalogFilters)filtered.sort((a,b)=>{if(catalogState.sort==='date')return byDate(a,b);const x=Number(a.price),y=Number(b.price);if(!(x>0)||!(y>0))return (x>0?-1:0)+(y>0?1:0);return (catalogState.sort==='price-asc'?x-y:y-x)||byDate(a,b)});
  grid.innerHTML=filtered.length?filtered.map(catalogFilters?catalogTourCard:tourCard).join(''):catalogFilters?'<div class="catalog-empty"><h2>По этим параметрам туров пока нет</h2><p>Попробуйте другое направление, период или диапазон стоимости.</p><button class="button button-line" type="button" data-reset-catalog>Сбросить фильтры</button></div>':'<div class="tour-empty"><h3>По этому запросу туров пока нет</h3><p>Выберите другое направление или оставьте заявку — поможем найти подходящий маршрут.</p></div>';
  grid.setAttribute('aria-busy','false');
  const count=$('#tour-count');if(count)count.textContent=`${filtered.length} ${filtered.length===1?'тур':filtered.length>=2&&filtered.length<=4?'тура':'туров'}`;
  if(catalogFilters){syncCatalogControls();updateCatalogUrl();$('#catalog-results-status').textContent=`Найдено путешествий: ${filtered.length}. Показаны все подходящие варианты.`}
  $$('.chip[data-region]').forEach(chip=>chip.classList.toggle('active',chip.dataset.region===selectedRegion));$$('.chip[data-tour-filter]').forEach(chip=>chip.classList.toggle('active',chip.dataset.tourFilter===selectedDifficulty));rewriteStaticLinks();
}
async function loadTours(){try{const res=await fetch(staticPreview?'./data/tours.json':'/api/tours');if(!res.ok)throw new Error('Failed');tours=(await res.json()).filter(tour=>tour.published!==false);tours.sort((a,b)=>(a.startDate||'9999').localeCompare(b.startDate||'9999'));initializeCatalogFilters();renderTours();renderTourDetail();rewriteStaticLinks()}catch{const grid=$('#tour-grid');if(grid){grid.setAttribute('aria-busy','false');grid.innerHTML='<div class="tour-empty">Не удалось загрузить туры. Обновите страницу позже.</div>'}const detail=$('#tour-detail');if(detail)detail.innerHTML='<p>Не удалось загрузить информацию о туре.</p>'}}
if($('#tour-grid')||$('#tour-detail'))loadTours();
if(!staticPreview&&$('[data-photo-slot]'))fetch('/api/site-images').then(response=>response.json()).then(images=>{$$('[data-photo-slot]').forEach(slot=>{const url=images[slot.dataset.photoSlot];if(!url)return;slot.classList.add('photo-filled');if(slot.classList.contains('panoramic-transition')){slot.style.setProperty('--transition-image',`url(${JSON.stringify(new URL(url,location.href).href)})`);slot.replaceChildren();return}slot.innerHTML=`<img src="${escapeHtml(url)}" alt="${escapeHtml(slot.textContent.trim().replace(/\s+/g,' '))}">`})}).catch(()=>{});
function smoothScrollTo(target){if(!target)return;const start=window.scrollY;const end=Math.max(0,target.getBoundingClientRect().top+start-8);const distance=end-start;const duration=Math.min(900,Math.max(480,Math.abs(distance)*.28));let began;const tick=time=>{began??=time;const t=Math.min(1,(time-began)/duration);const eased=1-Math.pow(1-t,3);window.scrollTo(0,start+distance*eased);if(t<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
$$('[data-region]').forEach(el=>el.addEventListener('click',event=>{selectedRegion=el.dataset.region;selectedDifficulty='all';renderTours();if(el.matches('a')){event.preventDefault();smoothScrollTo(document.getElementById('tours'));el.closest('details')?.removeAttribute('open')}}));
$$('[data-tour-filter]').forEach(el=>el.addEventListener('click',event=>{event.preventDefault();selectedDifficulty=el.dataset.tourFilter;selectedRegion='all';renderTours();smoothScrollTo(document.getElementById('tours'));el.closest('details')?.removeAttribute('open')}));

function renderTourDetail(){const container=$('#tour-detail');if(!container)return;const slug=staticPreview?new URLSearchParams(location.search).get('slug'):decodeURIComponent(location.pathname.split('/').pop());const tour=tours.find(item=>item.slug===slug);if(!tour){container.innerHTML='<div class="container missing-tour"><h1>Тур не найден</h1><a class="button button-gold" href="/tours">Вернуться к турам</a></div>';rewriteStaticLinks();return}document.title=`${tour.title} — Спортивный цех`;const program=(tour.program||[]).map((item,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span><p>${escapeHtml(item)}</p></li>`).join('');container.innerHTML=`<section class="detail-hero"><div class="container"><a class="detail-back" href="/tours">← Все туры</a><p class="eyebrow">${escapeHtml(tour.region)} / ${escapeHtml(tour.category||'Поход')}</p><h1>${escapeHtml(tour.title)}</h1><p>${escapeHtml(tour.summary||'Подробности маршрута')}</p><div class="detail-meta"><span><small>Даты</small><strong>${escapeHtml(dateLabel(tour))}</strong></span><span><small>Длительность</small><strong>${escapeHtml(tour.duration||'Уточняется')}</strong></span><span><small>Сложность</small><strong>${escapeHtml(tour.difficulty||'Уточняется')}</strong></span><span><small>Стоимость</small><strong>${money(tour.price)}</strong></span></div></div></section><section class="section detail-content topo"><div class="container detail-grid"><div><div class="detail-image ${tour.image?'':'media-placeholder'}">${tour.image?`<img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.title)}">`:'<span class="placeholder-mark"><span class="ui-icon icon-image-plus" aria-hidden="true"></span></span><strong>Фото маршрута</strong><small>Загрузите реальную фотографию в управлении турами</small>'}</div><h2>О путешествии</h2><p>${escapeHtml(tour.description||tour.summary||'Описание появится после заполнения тура.')}</p><h2>Программа</h2><ol class="program-list">${program||'<li><p>Программа появится после заполнения тура.</p></li>'}</ol><div class="detail-facts"><div><h3>Что входит</h3><p>${escapeHtml(tour.included||'Уточняется у организатора.')}</p></div><div><h3>Что оплачивается отдельно</h3><p>${escapeHtml(tour.notIncluded||'Уточняется у организатора.')}</p></div></div></div><aside class="detail-booking"><p class="eyebrow">МЕСТО В ГРУППЕ</p><h3>${money(tour.price)}</h3><p>${escapeHtml(dateLabel(tour))} · ${escapeHtml(tour.duration||'')}</p><a class="button button-gold" href="/#contact">Оставить заявку →</a><small>Организатор расскажет об условиях участия до подтверждения записи.</small></aside></div></section>`;rewriteStaticLinks()}

const contactForm=$('#contact-form');contactForm?.addEventListener('submit',async event=>{event.preventDefault();const message=$('#form-message');if(staticPreview){message.textContent='Это демонстрационная версия: заявка не отправляется. Связь будет доступна после запуска сайта на сервере.';return}const data=Object.fromEntries(new FormData(contactForm));const button=contactForm.querySelector('button[type=submit]');button.disabled=true;message.textContent='Отправляем заявку…';try{const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!response.ok)throw new Error('Не удалось отправить заявку');contactForm.reset();message.textContent='Спасибо! Заявка сохранена. Организатор сможет увидеть её в панели управления.'}catch{message.textContent='Не удалось отправить заявку. Попробуйте ещё раз.'}finally{button.disabled=false}});
rewriteStaticLinks();

const contactDialog=$('#contact');
let contactCloseTimer,contactOpenFrame;
const contactPhoto=contactDialog?.querySelector('.contact-dialog-visual img');
const warmContactPhoto=()=>contactPhoto?.decode?.().catch(()=>{});
if('requestIdleCallback' in window)requestIdleCallback(warmContactPhoto,{timeout:1500});else setTimeout(warmContactPhoto,500);
const openContact=()=>{if(!contactDialog?.showModal)return;clearTimeout(contactCloseTimer);cancelAnimationFrame(contactOpenFrame);if(!contactDialog.open)contactDialog.showModal();contactDialog.querySelector('.dialog-close')?.focus({preventScroll:true});contactOpenFrame=requestAnimationFrame(()=>{contactOpenFrame=requestAnimationFrame(()=>contactDialog.classList.add('is-visible'))})};
const closeContact=()=>{if(!contactDialog?.open)return;cancelAnimationFrame(contactOpenFrame);contactDialog.classList.remove('is-visible');clearTimeout(contactCloseTimer);contactCloseTimer=setTimeout(()=>contactDialog.close(),matchMedia('(prefers-reduced-motion: reduce)').matches?0:360)};
// Replace these with the client's actual profile URLs before launch; no visitor is sent to an unrelated account.
const messengerUrls={max:'',vk:''};
$$('[data-messenger]').forEach(button=>button.addEventListener('click',()=>{const destination=messengerUrls[button.dataset.messenger];if(destination){window.open(destination,'_blank','noopener,noreferrer')}else{const message=$('#messenger-message');if(message)message.textContent='Ссылка на профиль клиента пока не добавлена. Оставьте телефон — мы свяжемся с вами.'}}));
contactDialog?.querySelector('.dialog-close')?.addEventListener('click',closeContact);
contactDialog?.addEventListener('click',event=>{if(event.target===contactDialog)closeContact()});
contactDialog?.addEventListener('cancel',event=>{event.preventDefault();closeContact()});
contactDialog?.addEventListener('close',()=>{contactDialog.classList.remove('is-visible');clearTimeout(contactCloseTimer);cancelAnimationFrame(contactOpenFrame)});
if(location.hash==='#contact')openContact();
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  if(link.hasAttribute('data-region')||link.hasAttribute('data-tour-filter')||link.id==='more-reviews')return;
  const id=decodeURIComponent(link.getAttribute('href').slice(1));const target=document.getElementById(id);if(!target)return;
  event.preventDefault();if(id==='contact'){openContact();return}smoothScrollTo(target);
  history.replaceState(null,'','#'+encodeURIComponent(id));
}));
$$('.desktop-nav .nav-dropdown').forEach(dropdown=>{let timer;const open=()=>{clearTimeout(timer);$$('.desktop-nav .nav-dropdown').forEach(other=>{if(other!==dropdown)other.open=false});dropdown.open=true};dropdown.addEventListener('mouseenter',open);dropdown.querySelector('summary')?.addEventListener('click',event=>{event.preventDefault();open()});dropdown.addEventListener('mouseleave',()=>{timer=setTimeout(()=>dropdown.open=false,160)})});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.desktop-nav .nav-dropdown'))$$('.desktop-nav .nav-dropdown').forEach(dropdown=>dropdown.open=false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape')$$('.desktop-nav .nav-dropdown').forEach(dropdown=>dropdown.open=false)});
const headerInner=$('.header-inner');const headerBrand=$('.header-inner .brand');const headerNav=$('.header-inner .desktop-nav');const headerMessengers=$('.header-inner .header-messengers');
if(headerInner&&headerBrand&&headerNav&&headerMessengers){
  const centerHeaderMessengers=()=>{if(innerWidth<=1050)return;const brand=headerBrand.getBoundingClientRect();const nav=headerNav.getBoundingClientRect();const header=headerInner.getBoundingClientRect();const width=headerMessengers.getBoundingClientRect().width;const gap=nav.left-brand.right;const left=brand.right+Math.max(0,(gap-width)/2)-header.left;headerInner.style.setProperty('--header-messengers-left',`${left}px`)};
  addEventListener('resize',centerHeaderMessengers);document.fonts?.ready.then(centerHeaderMessengers);centerHeaderMessengers();
}
const routeMap=$('#route-map');const routePath=$('#route-progress-path');
if(routeMap&&routePath){
  const roadShape=$('#journey-road-shape');const length=roadShape.getTotalLength();routePath.style.strokeDasharray=`${length} ${length}`;
  const progressTip=$('#route-progress-tip');
  const mobileRoadShape=$('#journey-mobile-shape');const mobileRoutePath=$('#route-mobile-progress-path');const mobileProgressTip=$('#route-mobile-progress-tip');const mobileLength=mobileRoadShape?.getTotalLength()||0;if(mobileRoutePath)mobileRoutePath.style.strokeDasharray=`${mobileLength} ${mobileLength}`;
  const stage=$('#journey-scroll-stage');const connectorLines=$$('.map-connectors line',routeMap);const markers=$$('.route-markers .marker-outer',routeMap);const steps=$$('.map-step',routeMap);const stepIcons=$$('.map-step-icon',routeMap);
  const updateMapGeometry=()=>{
    if(innerWidth<=1050)return;
    const bounds=routeMap.getBoundingClientRect();
    steps.forEach((step,index)=>{
      const node=markers[index]?.getBoundingClientRect();const icon=stepIcons[index]?.getBoundingClientRect();if(!node||!icon)return;
      const nodeX=node.left+node.width/2-bounds.left;
      step.style.left=`${nodeX-(index===3?step.offsetWidth-icon.width/2:icon.width/2)}px`;
    });
    connectorLines.forEach((line,index)=>{
      const icon=stepIcons[index]?.getBoundingClientRect();const node=markers[index]?.getBoundingClientRect();if(!icon||!node)return;
      const iconCenter=icon.left+icon.width/2;const nodeCenter=node.left+node.width/2;
      const iconBelow=node.top>icon.bottom;
      line.setAttribute('x1',String(iconCenter-bounds.left));line.setAttribute('y1',String((iconBelow?icon.bottom:icon.top)-bounds.top));
      line.setAttribute('x2',String(nodeCenter-bounds.left));line.setAttribute('y2',String((iconBelow?node.top:node.bottom)-bounds.top));
    });
  };
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let targetProgress=0;let shownProgress=0;let velocity=0;let lastFrame=0;let animating=false;let initialized=false;
  const paint=()=>{routePath.style.strokeDashoffset=String(length*(1-shownProgress));if(progressTip){const point=roadShape.getPointAtLength(length*shownProgress);progressTip.setAttribute('cx',String(point.x));progressTip.setAttribute('cy',String(point.y));progressTip.style.opacity=shownProgress>.005&&shownProgress<.995?'1':'0'}if(mobileRoadShape&&mobileRoutePath){mobileRoutePath.style.strokeDashoffset=String(mobileLength*(1-shownProgress));if(mobileProgressTip){const point=mobileRoadShape.getPointAtLength(mobileLength*shownProgress);mobileProgressTip.setAttribute('cx',String(point.x));mobileProgressTip.setAttribute('cy',String(point.y));mobileProgressTip.style.opacity=shownProgress>.005&&shownProgress<.995?'1':'0'}}};
  const animate=time=>{const elapsed=lastFrame?Math.min(64,time-lastFrame)/1000:.016;lastFrame=time;const gap=targetProgress-shownProgress;
    if(Math.abs(gap)<.0006){shownProgress=targetProgress;velocity=0;paint();animating=false;lastFrame=0;return}
    const acceleration=.85;const desiredVelocity=Math.sign(gap)*Math.min(.42,Math.sqrt(2*acceleration*Math.abs(gap)));
    velocity+=Math.max(-acceleration*elapsed,Math.min(acceleration*elapsed,desiredVelocity-velocity));
    const move=velocity*elapsed;
    if(Math.sign(move)===Math.sign(gap)&&Math.abs(move)>=Math.abs(gap)){shownProgress=targetProgress;velocity=0}else shownProgress=Math.max(0,Math.min(1,shownProgress+move));
    if(Math.abs(targetProgress-shownProgress)<.0006&&Math.abs(velocity)<.02){shownProgress=targetProgress;velocity=0;paint();animating=false;lastFrame=0;return}
    paint();requestAnimationFrame(animate)};
  let pending=false;
  const updateRoute=()=>{pending=false;const rect=routeMap.getBoundingClientRect();let progress;
    if(innerWidth>1050&&stage){const area=stage.getBoundingClientRect();const distance=Math.max(1,area.height-innerHeight);progress=-area.top/distance}
    else if(innerWidth<=700){const readingLine=innerHeight*.36;progress=(readingLine-rect.top)/Math.max(1,rect.height)}
    else{const start=innerHeight*.8;const finish=-rect.height*.35;progress=(start-rect.top)/(start-finish)}
    targetProgress=Math.max(0,Math.min(1,progress));
    if(!initialized||reducedMotion.matches){shownProgress=targetProgress;velocity=0;initialized=true;paint();return}
    if(!animating){animating=true;requestAnimationFrame(animate)}};
  const scheduleRoute=()=>{if(!pending){pending=true;requestAnimationFrame(updateRoute)}};
  addEventListener('scroll',scheduleRoute,{passive:true});addEventListener('resize',()=>{scheduleRoute();updateMapGeometry()});scheduleRoute();updateMapGeometry();document.fonts?.ready.then(updateMapGeometry);
}
$$('[data-carousel]').forEach(carousel=>{
  const track=$('[data-carousel-track]',carousel);const next=$('[data-carousel-next]',carousel);
  if(!track||!track.children.length)return;
  const gallery=carousel.classList.contains('gallery-carousel');
  const galleryPages=gallery?Array.from(track.children):null;
  const galleryPhotos=gallery?$$('.gallery-photo',track):null;
  const reviewCards=gallery?null:Array.from(track.children);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let mobile=false;let slides=[];let size=0;let cycle=0;let middle=0;let drag=null;let animation=null;let frame=0;
  const cancelAnimation=()=>{cancelAnimationFrame(frame);frame=0;animation=null};
  const makeCopy=slide=>{const copy=slide.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));copy.setAttribute('aria-hidden','true');copy.inert=true;return copy};
  // Keep the viewport in the middle copy. Moving one full cycle is visually identical,
  // including a freely dragged partial slide; no scrollend event or snapping is needed.
  const normalize=()=>{if(!cycle)return;const offset=track.scrollLeft-middle;const shift=-Math.floor((offset+.5)/cycle)*cycle;if(Math.abs(shift)<1)return;track.scrollLeft+=shift;if(drag)drag.left+=shift;if(animation){animation.position+=shift;animation.target+=shift}};
  const measure=()=>{if(!slides.length)return;const bounds=track.getBoundingClientRect();const first=slides[size].getBoundingClientRect();cycle=slides[size*2].getBoundingClientRect().left-first.left;middle=track.scrollLeft+first.left-bounds.left-(gallery&&!mobile?(bounds.width-first.width)/2:0)};
  const rebuild=()=>{
    cancelAnimation();drag=null;track.classList.remove('is-dragging');mobile=matchMedia('(max-width:700px)').matches;
    const filledPhotos=new Map($$('.gallery-photo.photo-filled',track).map(photo=>[photo.dataset.photoSlot,photo]));
    const originals=gallery?(mobile?galleryPhotos:galleryPages).map(slide=>slide.cloneNode(true)):reviewCards;
    originals.forEach(slide=>{const photos=slide.matches('.gallery-photo')?[slide]:$$('.gallery-photo',slide);photos.forEach(photo=>{const filled=filledPhotos.get(photo.dataset.photoSlot);if(filled){photo.className=filled.className;photo.innerHTML=filled.innerHTML}})});size=originals.length;
    track.replaceChildren(...originals.map(makeCopy),...originals,...originals.map(makeCopy));slides=Array.from(track.children);measure();track.scrollLeft=middle;
  };
  // Critically damped motion preserves velocity on repeated clicks and at loop seams.
  const tick=time=>{
    if(!animation)return;
    const elapsed=Math.min(50,animation.previous==null?16:time-animation.previous)/1000;animation.previous=time;
    const omega=reducedMotion.matches?28:10,error=animation.position-animation.target,decay=Math.exp(-omega*elapsed),step=(animation.velocity+omega*error)*elapsed;
    animation.position=animation.target+(error+step)*decay;animation.velocity=(animation.velocity-omega*step)*decay;
    track.scrollLeft=animation.position;normalize();
    if(Math.abs(animation.target-animation.position)<.4&&Math.abs(animation.velocity)<4){track.scrollLeft=animation.target;normalize();cancelAnimation();return}
    frame=requestAnimationFrame(tick);
  };
  const go=direction=>{normalize();const distance=slides[size+1].getBoundingClientRect().left-slides[size].getBoundingClientRect().left;if(animation){animation.target+=distance*direction;return}animation={position:track.scrollLeft,target:track.scrollLeft+distance*direction,velocity:0,previous:null};frame=requestAnimationFrame(tick)};
  next?.addEventListener('click',()=>go(1));
  track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(event.key==='ArrowRight'?1:-1)}});
  track.addEventListener('scroll',normalize,{passive:true});
  track.addEventListener('wheel',cancelAnimation,{passive:true});
  track.addEventListener('pointerdown',event=>{cancelAnimation();if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,left:track.scrollLeft};track.classList.add('is-dragging');track.setPointerCapture(event.pointerId)});
  track.addEventListener('pointermove',event=>{if(!drag)return;track.scrollLeft=drag.left-(event.clientX-drag.x);normalize()});
  const finish=()=>{drag=null;track.classList.remove('is-dragging');normalize()};track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);track.addEventListener('lostpointercapture',finish);
  let resizeFrame=0;const resize=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(mobile!==matchMedia('(max-width:700px)').matches){rebuild();return}const fraction=cycle?(track.scrollLeft-middle)/cycle:0;cancelAnimation();measure();track.scrollLeft=middle+fraction*cycle;normalize()})};
  addEventListener('resize',resize);new ResizeObserver(resize).observe(track);rebuild();document.fonts?.ready.then(resize);
});
// Supply a verified review-platform URL here when the client chooses the destination.
const externalReviewsUrl='';
const moreReviews=$('#more-reviews');if(moreReviews&&externalReviewsUrl){moreReviews.href=externalReviewsUrl;moreReviews.target='_blank';moreReviews.rel='noopener noreferrer'}else moreReviews?.addEventListener('click',event=>event.preventDefault());
const faqButtons=$$('.faq-question');
const faqAnimations=new WeakMap();
const setFaqOpen=(button,open,animate=true)=>{
  const answer=document.getElementById(button.getAttribute('aria-controls'));if(!answer)return;
  const currentHeight=answer.getBoundingClientRect().height;faqAnimations.get(answer)?.cancel();
  button.setAttribute('aria-expanded',String(open));button.closest('.faq-item').classList.toggle('is-open',open);answer.inert=!open;
  const targetHeight=open?answer.querySelector('.faq-answer-inner').scrollHeight:0;
  answer.style.height=open?'auto':'0px';
  if(!animate||!answer.animate)return;
  const animation=answer.animate([{height:`${currentHeight}px`},{height:`${targetHeight}px`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?140:560,easing:'cubic-bezier(.22,.65,.3,1)'});
  faqAnimations.set(answer,animation);animation.onfinish=()=>faqAnimations.delete(answer);
};
faqButtons.forEach(button=>{setFaqOpen(button,false,false);button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';faqButtons.forEach(other=>{if(other!==button&&other.getAttribute('aria-expanded')==='true')setFaqOpen(other,false)});setFaqOpen(button,open)})});
