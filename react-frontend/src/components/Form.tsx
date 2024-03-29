import axios from 'axios';
import React, { useEffect, useState } from 'react';
import PolynomialInput from './PolynomialInput';
import Charts from './Charts';

interface PostBody {
	a: string;
	b: string;
	symbol: string | undefined;
	i: number;
	debug: boolean;
}

// setting this value to true will render a_n, b_n, and p_n/q_n for debugging purposes
const SHOW_DEBUG_CHARTS = false;

type XYPair = [number, number];
type CoordinateList = XYPair[];

function Form() {
	const [iterationCount, setIterationCount] = useState(1000);
	const [numeratorIsValid, setNumeratorValidity] = useState(false);
	const [denominatorIsValid, setDenominatorValidity] = useState(false);
	const [polynomialA, setPolynomialA] = useState('');
	const [polynomialB, setPolynomialB] = useState('');
	const [results, setResults] = useState<CoordinateList>([]);
	const [showCharts, setShowCharts] = useState(false);
	const [noConvergence, setNoConvergence] = useState(false);
	const [waitingForResponse, setWaitingForResponse] = useState(false);

	useEffect(() => {
		document.getElementsByTagName('input')[0].focus();
	}, []);

	const onlyOneSymbolUsed = function () {
		const matches = (polynomialA + polynomialB).matchAll(/([a-zA-Z])/g);
		const distinctCharacters = new Set();
		for (const match of matches) {
			distinctCharacters.add(match[0]);
		}
		return distinctCharacters.size <= 1;
	};

	const errorClassFn = () => {
		return `error-message ${onlyOneSymbolUsed() ? 'hidden' : ''}`;
	};

	const spinnerClassFn = () => {
		return `spinner ${waitingForResponse ? '' : 'hidden'}`;
	};

	const formClassFn = () => {
		return `form ${
			numeratorIsValid && denominatorIsValid && onlyOneSymbolUsed() ? '' : 'invalid'
		} ${showCharts ? 'hidden' : ''}`;
	};

	const validateIterations = function (iterations: number) {
		if (iterations > 10000 || iterations <= 0) {
			setIterationCount(10000);
		} else setIterationCount(iterations);
	};

	const submit = (e: any) => {
		e.preventDefault();
		setWaitingForResponse(true);
		setNoConvergence(false);
		const body: PostBody = {
			a: polynomialA,
			b: polynomialB,
			symbol: polynomialA.match(/([a-zA-Z])/)?.[0] ?? polynomialB.match(/([a-zA-Z])/)?.[0] ?? '',
			i: iterationCount,
			debug: SHOW_DEBUG_CHARTS
		};
		axios
			.post('/analyze', body)
			.then((response) => {
				setWaitingForResponse(false);
				if (response.status == 200) {
					if (response.data.converges_to) {
						setResults(response.data);
						setShowCharts(true);
					} else {
						setNoConvergence(true);
					}
				} else {
					setShowCharts(false);
					console.warn(response.data.error);
				}
			})
			.catch((error) => console.log(error.toJSON()));
	};

	return (
		<div>
			<form className={formClassFn()} onSubmit={submit}>
				<div>
					<p>
						Welcome to the Ramanujan Machine Polynomial Continued Fraction Explorer. Please enter
						the a
						<sub>
							<i>n</i>
						</sub>{' '}
						and b
						<sub>
							<i>n</i>
						</sub>{' '}
						polynomials below. They will define a continued fraction of the form:
					</p>
					<div className="image-parent">
						<img src="pcf.png" alt="polynomial continued fraction template pretty printed" />
					</div>
					<p>
						Which will then be calculated up to depth <i>n</i>.
					</p>

					<PolynomialInput
						numerator={true}
						updateFormValidity={(fieldValidity: boolean) => {
							setNoConvergence(false);
							setNumeratorValidity(fieldValidity);
						}}
						updatePolynomial={(polynomial: string) => {
							setNoConvergence(false);
							setPolynomialA(polynomial);
						}}></PolynomialInput>
					<PolynomialInput
						updateFormValidity={(fieldValidity: boolean) => {
							setNoConvergence(false);
							setDenominatorValidity(fieldValidity);
						}}
						updatePolynomial={(polynomial: string) => {
							setNoConvergence(false);
							setPolynomialB(polynomial);
						}}></PolynomialInput>
					<div className={errorClassFn()}>Please limit your polynomials to one variable</div>
					<div className="form-field">
						<div>
							<label>&nbsp;n&nbsp;</label>
						</div>
						<div>
							<input
								type="number"
								value={iterationCount}
								onChange={(event) => {
									validateIterations(Number(event.target.value));
								}}
							/>
						</div>
					</div>
					<button>
						<div className={spinnerClassFn()}></div>
						<div className="button-text">Analyze</div>
					</button>
				</div>
			</form>
			{noConvergence ? <h3>The provided polynomials do not converge.</h3> : null}
			{showCharts ? (
				<Charts
					showDebugCharts={SHOW_DEBUG_CHARTS}
					results={results}
					toggleDisplay={() => {
						setNoConvergence(false);
						setShowCharts(!showCharts);
					}}></Charts>
			) : null}
		</div>
	);
}

export default Form;
