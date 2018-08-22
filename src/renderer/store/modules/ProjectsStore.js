import {
	App
} from "../../../core/Application";
import {
	Notifications
} from "../../../core/Notification";
import {
	AppManager
} from '../../../core/ApplicationManager'
import {
	EventsManager
} from '../../../core/EventManager.js'


class Project {
	constructor(title, description, categories) {
		this.id = -1;
		this.title = title;
		this.description = description;
		this.categories = categories;
		this.opened_timeline_id = 0;
	}
}

const state = {
	// Contains all the projects created in the application.
	projects: null,
}

const getters = {
	GetProjectById(state) {
		return (id) => state.projects.filter(project => project.id == id)[0];
	},

	projects(state) {
		return state.projects;
	}
}

const mutations = {
	/**
	 * This function checks if the project's data in param is valid
	 * and add store it in the database. 
	 * @param {*State} state ProjectStore state.
	 * @param {*Project} data Contains the project's title and description.
	 */
	CreateProject(state, data) {
		// Make sure the project's data is valid.
		if (data.title == null || data.description == null || data.categories == null || data.categories.length <= 0)
			Notifications.Error('CreateProject', "Cannot create a project with invalid data " + data);

		// Create the new project to store.
		let project = new Project(data.title, data.description, data.categories);

		// Create the database for the project.
		project.id = App.CreateDB();

		const appDB = App.GetAppDB();
		// Store the project in the database.
		appDB.Write('projects', project);

		const projectDB = App.GetDB(project.id);
		// Store the project info in its own database
		projectDB.SetValue('info', project);

		// Create first timeline.
		projectDB.Write('timelines', {
			id: 0,
			title: 'Default'
		});

		// Create empty notes array
		projectDB.SetValue('notes', [])

		// Update the state
		state.projects = appDB.GetAll('projects', 'id');
	},

	UpdateProject(state, data) {
		// Make sure the project's data is valid.
		if (data.id == null || data.title == null || data.description == null || data.categories == null || data.categories.length <= 0)
			Notifications.Error('UpdateProject', "Cannot update a project with invalid data " + Object.values(data));

		// Update the project
		App.GetDB(data.id).SetValue('info', data)
		App.GetAppDB().Update('projects', {
			id: data.id
		}, data);

		// Update the state
		state.projects = App.GetAppDB().GetAll('projects', 'id');

		// Update the layout
		EventsManager.Emit('update-notes-component');
	},

	FoldCategory(state, data) {
		console.log(data)
		if (data.projectId == null || data.category.tag == null || data.category.title == null) Notifications.Error('FoldCategory', `Cannot fold a category with invalid data ${data}`);

		const projectDB = App.GetDB(data.projectId);
		const projectInfo = projectDB.GetValue('info');
		projectInfo.categories.forEach(category => {
			if (category.tag == data.category.tag && category.title == data.category.title) category.folded = true;
		})

		projectDB.SetValue('info', projectInfo);
		App.GetAppDB().Update('projects', {
			id: projectInfo.id
		}, projectInfo);

		// Update the state
		state.projects = App.GetAppDB().GetAll('projects', 'id');

		// Update the layout
		EventsManager.Emit('update-notes-component');
	},

	SetProjectTimelineId(state, data) {
		// Check if the data is valid.
		if (data.project_id == null || data.project_id < 0 || data.timeline_id == null || data.timeline_id < 0)
			throw new Error("Cannot set invalid timeline data to project.");

		// Update the project.
		App.GetDB(data.project_id).Update('info', null, {
			opened_timeline_id: data.timeline_id
		});

		// Update the projects.
		// state.projects = dbUtils.GetAll('projects', 'id');
	},

	/**
	 * Update the content of the projets.
	 */
	UpdateProjects(state) {
		state.projects = App.GetAppDB().GetAll('projects', 'id');
	}
}

export default {
	state,
	getters,
	mutations
}