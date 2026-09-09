import { Icon } from './ui/Icon';
import { Logo } from './ui/Logo';

const groups = [
  {title:'Produk', links:[['Fitur','#fitur'],['Harga','#harga'],['Testimoni','#testimoni'],['FAQ','#faq']]},
  {title:'Solusi', links:[['Untuk Owner','#solusi'],['Untuk Kasir','#solusi'],['Untuk Kapster','#solusi'],['Multi-outlet','#fitur']]},
  {title:'Perusahaan', links:[['Tentang Kami','#top'],['Karir','#kontak'],['Blog','#kontak'],['Kontak','#kontak']]},
  {title:'Bantuan', links:[['Pusat Bantuan','#faq'],['Kebijakan Privasi','#kontak'],['Syarat & Ketentuan','#kontak']]}
];

export function Footer(){return <footer id="kontak"><div className="container footer-grid motion-reveal"><div><div className="brand footer-brand"><Logo/></div><p>Solusi operasional barbershop modern untuk bisnis yang lebih rapi, efisien, dan berkembang.</p><div className="socials" aria-label="Media sosial"><a href="#kontak" aria-label="Instagram"><Icon name="instagram" size={18}/></a><a href="#kontak" aria-label="YouTube"><Icon name="youtube" size={18}/></a><a href="#kontak" aria-label="TikTok"><Icon name="tiktok" size={18}/></a><a href="#kontak" aria-label="LinkedIn"><Icon name="linkedin" size={18}/></a></div></div>{groups.map(group=><Foot key={group.title} title={group.title} links={group.links}/>) }<div><h4>Kontak</h4><a className="contact" href="mailto:hello@kapster.id"><Icon name="mail" size={15}/> hello@kapster.id</a><a className="contact" href="tel:+6281234567890"><Icon name="phone" size={15}/> +62 812-3456-7890</a><p className="contact"><Icon name="pin" size={15}/> Jakarta, Indonesia</p></div></div><div className="container footer-bottom"><span>© 2025 Kapster.id. Semua hak dilindungi.</span><a href="#top">Good Barbers Build Better People. ↑</a></div></footer>}
function Foot({title,links}:{title:string;links:string[][]}){return <div><h4>{title}</h4>{links.map(([label,href])=><a key={label} href={href}>{label}</a>)}</div>}
