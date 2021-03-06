const Hapi = require('hapi')
const Inert = require('inert')
const Vision = require('vision')
const Handlebars = require('handlebars')
const firebase = require('firebase')
const Path = require('path')
const Joi = require('joi')
require('dotenv').config()

const server = new Hapi.Server()

const config = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    databaseURL:"https://assignment-04-api.firebaseio.com",
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID
}
firebase.initializeApp(config)

const db = firebase.database()
const book = db.ref('books')


const nestedPub = Joi.object().keys({
		published_date: Joi.number().integer(),
		publisher: Joi.string().required(),
		edition: Joi.number().integer()
})
const nestedStatus = Joi.object().keys({
		borrowed: Joi.boolean().required(),
		reserved: Joi.boolean().required()
})
const schemaBook = {
	title: Joi.string().required(),
	isbn: Joi.string().required(),
	author: Joi.string().required(),
	genre: Joi.string().required(),
	pub_inf: nestedPub,
	status: nestedStatus
}



module.exports=[
	{
	method:'GET',
		path:'/',
		handler: (request, reply) =>{
			reply.view('index')
		}
	},
	{
	method:'GET',
		path:'/books/all',
		handler: (request, reply) =>{
			let books
			book.once('value', data => {
				books = data.val()
				reply.view('all',{
					books: books
				}) 
			})
		}
	},
	{
	method:'GET',
		path:'/books/search',
		handler: (request, reply) =>{
			reply.view('search')
		}
	},
	{
	method:'GET',
		path:'/books/query/',
		handler: (request, reply) =>{
			let books
			let name = request.query.name
			let field = request.query.field
			console.log(`${field}: ${name}`)
			const query = book.orderByChild(`${field}`)
								.equalTo(`${name}`)
			query.once('value', data =>{
				console.log(data)
				books = data.val()
				console.log(books)
				reply.view('all', {books:books}) 
				})			
		}
	},
	{
	method:'GET',
		path:'/books/new',
		handler: (request, reply) =>{
			reply.view('new') 
		}
	},
	{
	method:'GET',
		path:'/books/{isbn}',
		handler: (request, reply) =>{
			let books
			let isbn = request.params.isbn
			book.once('value', data => {
				books = data.val()
				let aBook = books[isbn]
				console.log(aBook)
				reply.view('single', aBook) 
			})		
		}
	},
	{
	method:'GET',
		path:'/books/{isbn}/edit',
		handler: (request, reply) =>{
			let books
			let isbn = request.params.isbn
			book.once('value', data => {
				books = data.val()
				let aBook = books[isbn]
				console.log(aBook)
				reply.view('edit', aBook) 
			})		
		}
	},
	{
	method:'POST',
		path:'/books/new',
		config: {
			validate:{
				payload: schemaBook[nestedStatus, nestedPub]
			}
		},
		handler: (request, reply) =>{
			let newBook = {
				title: request.payload.title,
				isbn: request.payload.isbn,
				author: request.payload.author,
				genre: request.payload.genre,
				pub_inf:{
					published_date: request.payload.published_date,
					publisher: request.payload.publisher,
					edition: request.payload.edition
				},
				status:{
					borrowed: request.payload.borrowed,
					reserved: request.payload.reserved
				}
			}
			book.child(`${newBook.isbn}`).set(newBook)
			reply.redirect().location('all')
		}
	}	
]