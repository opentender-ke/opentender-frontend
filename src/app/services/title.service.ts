import {Injectable} from '@angular/core';
import {CountryService} from './country.service';
import {Router, NavigationStart, ActivatedRoute, NavigationEnd} from '@angular/router';
import {Title} from '@angular/platform-browser';

@Injectable()
export class TitleService {
	defaultName = 'OpenTender Portal';

	constructor(private activatedRoute: ActivatedRoute, private country: CountryService, private router: Router, private titleService: Title) {
		this.defaultName += ' ' + country.get().name;
		router.events.subscribe(e => {
				if (e instanceof NavigationStart) {
					this.setDefault();
				} else if (e instanceof NavigationEnd) {
					let route = this.activatedRoute;
					while (route.firstChild) {
						route = route.firstChild;
					}
					if (route.data && route.data['value'] && route.data['value'].title) {
						this.set(route.data['value'].title);
					}
				}
			}
		);
	}

	setDefault() {
		this.set('');
	}

	set(value: string) {
		let result = (value || '').trim();
		if (result.length > 40) result = result.slice(0, 40) + '…';
		result = (result.length > 0 ? result + ' - ' : '') + this.defaultName;
		this.titleService.setTitle(result);
	}

}
