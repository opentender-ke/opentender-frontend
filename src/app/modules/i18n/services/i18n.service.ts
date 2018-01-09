import {Injectable, Inject, TRANSLATIONS} from '@angular/core';
import {I18NHtmlParser, HtmlParser, Xliff} from '@angular/compiler';
import {Consts} from '../../../model/consts';
import * as i18nlanguages from '../../../../i18n/languages.json';
import {Utils} from '../../../model/utils';

declare module '*languages.json' {
	export var enabled: Array<{
		id: string;
		name: string;
	}>;
}

interface INumeralName {
	one?: string;
	other?: string;
}

// http://bmanolov.free.fr/numbers_names.php
const LARGE_NUMBERS_EN_US = [
	{},
	{other: 'Thousandth'},
	{other: 'Million'},
	{other: 'Billion'},
	{other: 'Trillion'},
	{other: 'Quadrillion'},
	{other: 'Quintillion'},
	{other: 'Sextillion'},
	{other: 'Septillion'},
	{other: 'Octillion'},
	{other: 'Nonillion'},
	{other: 'Decillion'},
	{other: 'Undecillion'},
	{other: 'Duodecillion'},
	{other: 'Tredecillion'},
	{other: 'Quattuordecillion'},
	{other: 'Quindecillion'},
	{other: 'Sexdecillion'},
	{other: 'Septdecillion'},
	{other: 'Octodecillion'},
	{other: 'Novemdecillion'},
	{other: 'Vigintillion'}
];

// http://bmanolov.free.fr/numbers_names.php
const LARGE_NUMBERS_EN_UK = [
	{},
	{other: 'Thousandth'},
	{other: 'Million'},
	{other: 'Milliard'},
	{other: 'Billion'},
	{other: 'Billiard'},
	{other: 'Trillion'},
	{other: 'Trilliard'},
	{other: 'Quadrillion'},
	{other: 'Quadrilliard'},
	{other: 'Quintillion'},
	{other: 'Quintillion'},
	{other: 'Sextillion'},
	{other: 'Sextilliard'},
	{other: 'Septillion'},
	{other: 'Septilliard'},
	{other: 'Octillion'},
	{other: 'Octilliard'},
	{other: 'Nonillion'},
	{other: 'Nonilliard'},
	{other: 'Decillion'},
	{other: 'Decilliard'}
];

@Injectable()
export class I18NService {
	public languages = i18nlanguages.enabled;
	private _extra;
	private _source: string;
	private _parser: I18NHtmlParser;
	private _translations: { [name: string]: any };
	public NameNotAvailable: string;

	constructor(@Inject(TRANSLATIONS) source: string, @Inject('TRANSLATIONS_EXTRA') extra) {
		this._extra = extra;
		this._source = source;
		if (this._source) {
			const xliff = new Xliff();
			this._translations = xliff.load(this._source, '').i18nNodesByMsgId;
			this._parser = new I18NHtmlParser(new HtmlParser(), this._source);
		}
		this.NameNotAvailable = this.get('[Name not available]');
	}

	// extras based translation

	public getTranslatedLargeNumberName(nn: INumeralName, value: number) {
		if (nn) {
			if (value === 1 && nn.one) {
				return nn.one;
			}
			return nn.other;
		}
		return null;
	}

	public getLargeNumberName(tier: number, value: number) {
		if (tier < 1) {
			return '';
		}
		let names = LARGE_NUMBERS_EN_UK;
		if (this._extra && this._extra.numerals) {
			names = this._extra.numerals;
		}
		let name = this.getTranslatedLargeNumberName(names[tier], value);
		if (name) {
			return name;
		}
		const nums = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
		return '*10' + (tier * 3).toString().split('').map(c => nums[parseInt(c, 10)]).join('');
	}

	public formatValue(value: number) {
		if (value === null || value === undefined) {
			return '';
		}
		if (value >= 1e6) {
			// https://stackoverflow.com/a/40724354
			// what tier? (determines SI prefix)
			let tier = Math.log10(value) / 3 | 0;

			// if zero, we don't need a prefix
			if (tier === 0) {
				return value.toLocaleString();
			}

			// determine scale
			let scale = Math.pow(10, tier * 3);

			// scale the number
			let scaled = value / scale;

			// format number and add prefix as suffix
			return scaled.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' ' + this.getLargeNumberName(tier, scaled);
		}
		return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
	}

	public formatCurrency(value: string) {
		if (value === undefined || value === null) {
			return '';
		}
		value = value.toUpperCase();
		if (Consts.currencies[value]) {
			return Consts.currencies[value];
		}
		return value;
	}

	public formatCurrencyValue(value: number, fractionSize: number = 2) {
		if (value === undefined) {
			return '';
		}
		return this.formatValue(value);
	}

	public formatCurrencyValueEUR(value: number, fractionSize: number = 2) {
		if (value === undefined) {
			return '';
		}
		return '€ ' + this.formatValue(value);
	}

	public nameGuard(value: string) {
		return value || this.NameNotAvailable;
	}

	public expandCountry(key: string): string {
		if (key === undefined || key === null) {
			return '';
		}
		if (this._extra) {
			if (this._extra.portals) {
				let result = this._extra.portals[key.toLowerCase()];
				if (result) {
					return result;
				}
			}
			if (this._extra.countries) {
				key = key.toUpperCase();
				if (key == 'UK') {
					key = 'GB';
				}
				let result = this._extra.countries[key];
				if (result) {
					return result;
				} else {
					console.log('no country translation', key);
				}
			}
		}
		return Consts.countries[key.toUpperCase()] || key;
	}

	public getPortalName(key: string, default_name: string): string {
		if (key && this._extra) {
			if (this._extra.portals) {
				let result = this._extra.portals[key.toLowerCase()];
				if (result) {
					return result;
				}
			}
			if (this._extra.countries) {
				key = key.toUpperCase();
				if (key == 'UK') {
					key = 'GB';
				}
				let result = this._extra.countries[key];
				if (result) {
					return result;
				}
			}
		}
		if (!key) {
			return this.get('Portals');
		}
		return default_name;
	}

	// template based translation

	public get(key: string): string {
		return this.getStrict(key) || key;
	}

	public getStrict(key: string): string {
		if (!this._translations) {
			return null;
		}
		let id = key.replace(/ /g, '');
		if (!this._translations[id]) {
			console.log('i18n, untranslated text', key);
			return null;
		}
		let results = this._translations[id].filter((node) => node.hasOwnProperty('value')).map(node => node.value);
		if (results.length === 0) {
			return null;
		}
		return results.join('');
	}

	public getFormat(key: string, interpolation: Array<{ key: string; value: any }> = []): string {
		if (!this._translations) {
			return this._simpleInterpolate(key, interpolation);
		}
		let id = key.replace(/ /g, '');
		if (!this._translations[id]) {
			console.log('i18n, untranslated text', key);
			return this._simpleInterpolate(key, interpolation);
		}
		let interpol = interpolation.map(i => i.value.toString());
		let placeholders = this._getPlaceholders(this._translations[id]);
		let parseTree = this._parser.parse(`<div i18n="@@${id}">content ${this._wrapPlaceholders(placeholders).join(' ')}</div>`, 'someI18NUrl');
		return this._interpolate(parseTree.rootNodes[0]['children'][0].value, this._interpolationWithName(placeholders, interpol));
	}

	public _simpleInterpolate(key: string, interpolation: Array<{ key: string; value: any }> = []) {
		if (interpolation && interpolation.length > 0) {
			let result = key;
			interpolation.forEach(i => {
				result = result.replace('{{' + i.key + '}}', i.value);
			});
			return result;
		}
		return '';
	}

	private _getPlaceholders(nodes: any[]): string[] {
		return nodes
			.filter((node) => node.hasOwnProperty('name'))
			.map((node) => `${node.name}`);
	}

	private _wrapPlaceholders(placeholders: string[]): string[] {
		return placeholders.map((node) => `{{${node}}}`);
	}

	private _interpolationWithName(placeholders: string[], interpolation: any[]): { [name: string]: any } {
		let asObj = {};
		placeholders.forEach((name, index) => {
			asObj[name] = interpolation[index];
		});
		return asObj;
	}

	private _interpolate(pattern: string, interpolation: { [name: string]: any }): string {
		let compiled = '';
		compiled += pattern.replace(/{{(\w+)}}/g, function(match, key) {
			if (interpolation[key] && typeof interpolation[key] === 'string') {
				match = match.replace(`{{${key}}}`, interpolation[key]);
			}
			return match;
		});
		return compiled;
	}
}